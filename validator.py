#!/usr/bin/env python3
"""
SupportNova Ground-Truth Crosscheck & Document Parsing Engine (Python 3.10)
Independent Python validation engine executing alongside AI (Pipeline 1)
and Rule Matrix (Pipeline 2) to perform deterministic cross-verification,
JSON schema validation, document parsing (PDF, DOCX, TXT), and traceable chunking.
"""

import sys
import json
import re
import io
import zlib
import base64
import hashlib
import xml.etree.ElementTree as ET
from typing import Dict, Any, List, Optional

# ==============================================================================
# 1. DOCUMENT VALIDATION, PARSING (PDF, DOCX, TXT) & TRACEABLE CHUNKING
# ==============================================================================

def validate_and_parse_document(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validates uploaded document files (.pdf, .docx, .txt, .md),
    extracts textual content using Python native parsing,
    and divides the document into traceable, hashed chunks (sections).
    """
    filename = payload.get("filename", "document.txt")
    raw_b64 = payload.get("fileContentBase64", "")
    explicit_title = payload.get("title", "")
    category = payload.get("category", "Customer Support & Operations")
    version = payload.get("version", "1.0")

    ext = filename.lower().split(".")[-1] if "." in filename else "txt"
    allowed_exts = ["pdf", "docx", "doc", "txt", "md"]

    if ext not in allowed_exts:
        return {
            "valid": False,
            "error": f"Unsupported file type '.{ext}'. Allowed types: PDF, DOCX, TXT, MD",
            "filename": filename
        }

    try:
        if raw_b64:
            file_bytes = base64.b64decode(raw_b64)
        else:
            file_bytes = payload.get("rawText", "").encode("utf-8")
    except Exception as e:
        return {
            "valid": False,
            "error": f"Failed to decode base64 file content: {str(e)}",
            "filename": filename
        }

    if len(file_bytes) == 0:
        return {
            "valid": False,
            "error": "Uploaded document is empty (0 bytes).",
            "filename": filename
        }

    extracted_paragraphs: List[str] = []
    extracted_title = explicit_title

    # --- DOCX Extraction ---
    if ext in ["docx", "doc"]:
        try:
            buf = io.BytesIO(file_bytes)
            with zipfile_open(buf) as zf:
                if "word/document.xml" not in zf.namelist():
                    return {
                        "valid": False,
                        "error": "Invalid DOCX format: missing word/document.xml",
                        "filename": filename
                    }
                xml_data = zf.read("word/document.xml")
                tree = ET.fromstring(xml_data)
                ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
                for p in tree.iter(f"{{{ns['w']}}}p"):
                    texts = [t.text for t in p.iter(f"{{{ns['w']}}}t") if t.text]
                    para_text = "".join(texts).strip()
                    if para_text:
                        extracted_paragraphs.append(para_text)
        except Exception as e:
            # Fallback text extraction if zip fails
            text_str = file_bytes.decode("utf-8", errors="ignore")
            extracted_paragraphs = [line.strip() for line in text_str.split("\n") if line.strip()]

    # --- PDF Extraction ---
    elif ext == "pdf":
        try:
            text_parts: List[str] = []
            # Extract plain text from stream objects and FlateDecode streams
            # 1. Uncompressed BT ... ET blocks
            bt_matches = re.findall(b"BT*(.*?)*ET", file_bytes, re.DOTALL)
            for b in bt_matches:
                str_matches = re.findall(rb"\((.*?)\)\s*T[jJ]", b)
                for sm in str_matches:
                    text_parts.append(sm.decode("latin-1", errors="ignore"))

            # 2. Decompress any FlateDecode streams
            stream_matches = re.findall(rb"stream[\r\n]+(.*?)[\r\n]+endstream", file_bytes, re.DOTALL)
            for sm in stream_matches:
                try:
                    decomp = zlib.decompress(sm)
                    sub_bt = re.findall(b"BT*(.*?)*ET", decomp, re.DOTALL)
                    for b in sub_bt:
                        strs = re.findall(rb"\((.*?)\)\s*T[jJ]", b)
                        for s in strs:
                            text_parts.append(s.decode("latin-1", errors="ignore"))
                except Exception:
                    continue

            # Fallback if binary PDF regex found little text
            if len("".join(text_parts).strip()) < 30:
                raw_ascii = re.findall(rb"[a-zA-Z0-9\s.,!?:;'\-\(\)]{4,}", file_bytes)
                text_parts = [r.decode("latin-1", errors="ignore").strip() for r in raw_ascii if len(r.strip()) > 10]

            extracted_paragraphs = [t.strip() for t in text_parts if t.strip()]
        except Exception as e:
            text_str = file_bytes.decode("latin-1", errors="ignore")
            extracted_paragraphs = [line.strip() for line in text_str.split("\n") if line.strip()]

    # --- TXT / Markdown Extraction ---
    else:
        text_str = file_bytes.decode("utf-8", errors="replace")
        extracted_paragraphs = [line.strip() for line in text_str.split("\n") if line.strip()]

    if not extracted_paragraphs:
        return {
            "valid": False,
            "error": "No readable text content could be parsed from the document.",
            "filename": filename
        }

    # Infer Title if not explicitly given
    if not extracted_title:
        extracted_title = extracted_paragraphs[0][:80]
        if len(extracted_paragraphs[0]) > 80:
            extracted_title += "..."

    # Full text and word metrics
    full_text = "\n\n".join(extracted_paragraphs)
    words = full_text.split()
    total_words = len(words)

    # --- Traceable Document Chunking ---
    sections: List[Dict[str, Any]] = []
    current_chunk: List[str] = []
    chunk_index = 1
    current_heading = f"Section {chunk_index}: Overview & Scope"

    for para in extracted_paragraphs:
        # Check if paragraph looks like a heading
        is_heading = (
            re.match(r"^(section\s*\d+|article\s*\d+|\d+\.|\bpolicy\b|\bscope\b|\beligibility\b|\brefund\b|\bescalation\b)", para, re.IGNORECASE)
            or (len(para) < 60 and para.endswith(":"))
            or (para.isupper() and len(para) < 50)
        )

        if is_heading and current_chunk:
            chunk_content = " ".join(current_chunk)
            chunk_hash = hashlib.sha256(chunk_content.encode("utf-8")).hexdigest()[:12]
            sections.append({
                "id": f"SEC-{str(chunk_index).zfill(2)}",
                "heading": current_heading,
                "content": chunk_content,
                "wordCount": len(chunk_content.split()),
                "charCount": len(chunk_content),
                "tokenEstimate": int(len(chunk_content.split()) * 1.3),
                "checksum": chunk_hash
            })
            chunk_index += 1
            current_heading = para[:70]
            current_chunk = []
        else:
            current_chunk.append(para)

        # Boundary check: avoid overly large chunks (> 250 words)
        if len(" ".join(current_chunk).split()) >= 250:
            chunk_content = " ".join(current_chunk)
            chunk_hash = hashlib.sha256(chunk_content.encode("utf-8")).hexdigest()[:12]
            sections.append({
                "id": f"SEC-{str(chunk_index).zfill(2)}",
                "heading": current_heading,
                "content": chunk_content,
                "wordCount": len(chunk_content.split()),
                "charCount": len(chunk_content),
                "tokenEstimate": int(len(chunk_content.split()) * 1.3),
                "checksum": chunk_hash
            })
            chunk_index += 1
            current_heading = f"Section {chunk_index}: Continuation"
            current_chunk = []

    # Final chunk
    if current_chunk:
        chunk_content = " ".join(current_chunk)
        chunk_hash = hashlib.sha256(chunk_content.encode("utf-8")).hexdigest()[:12]
        sections.append({
            "id": f"SEC-{str(chunk_index).zfill(2)}",
            "heading": current_heading,
            "content": chunk_content,
            "wordCount": len(chunk_content.split()),
            "charCount": len(chunk_content),
            "tokenEstimate": int(len(chunk_content.split()) * 1.3),
            "checksum": chunk_hash
        })

    # Summary: first ~2-3 sentences or first 60 words
    summary_words = words[:50]
    summary = " ".join(summary_words) + ("..." if len(words) > 50 else "")

    return {
        "valid": True,
        "filename": filename,
        "fileType": ext.upper(),
        "title": extracted_title,
        "category": category,
        "version": version,
        "status": "Active",
        "totalWords": total_words,
        "totalChars": len(full_text),
        "chunkCount": len(sections),
        "summary": summary,
        "sections": sections,
        "parsedAt": "Python 3.10 Traceable Parser"
    }

def zipfile_open(buf):
    import zipfile
    return zipfile.ZipFile(buf, "r")


# ==============================================================================
# 2. JSON SCHEMA VALIDATION FOR GENAI (PIPELINE 1)
# ==============================================================================

def validate_genai_json_schema(ai_output: Dict[str, Any]) -> List[Dict[str, str]]:
    """
    Validates that the GenAI JSON output strictly conforms to the expected schema.
    Returns any schema violation findings.
    """
    violations = []
    required_keys = [
        ("primaryIssue", str),
        ("category", str),
        ("urgency", str),
        ("priority", str),
        ("recommendedDepartment", str),
        ("draftedResponse", str),
        ("escalationRequired", bool)
    ]

    for key, expected_type in required_keys:
        if key not in ai_output:
            violations.append({
                "type": "SCHEMA_MISSING_KEY",
                "message": f"GenAI output JSON missing mandatory property '{key}'."
            })
        elif not isinstance(ai_output[key], expected_type):
            violations.append({
                "type": "SCHEMA_TYPE_MISMATCH",
                "message": f"GenAI property '{key}' is of type {type(ai_output[key]).__name__}, expected {expected_type.__name__}."
            })

    # Check allowed values
    valid_urgencies = ["Low", "Medium", "High", "Critical"]
    if ai_output.get("urgency") and ai_output.get("urgency") not in valid_urgencies:
        violations.append({
            "type": "SCHEMA_INVALID_ENUM",
            "message": f"Invalid urgency value '{ai_output.get('urgency')}'. Must be one of: {valid_urgencies}"
        })

    valid_priorities = ["P1", "P2", "P3", "P4"]
    if ai_output.get("priority") and ai_output.get("priority") not in valid_priorities:
        violations.append({
            "type": "SCHEMA_INVALID_ENUM",
            "message": f"Invalid priority value '{ai_output.get('priority')}'. Must be one of: {valid_priorities}"
        })

    return violations


# ==============================================================================
# 3. GROUND-TRUTH CROSSCHECK VALIDATOR (PIPELINE 1 VS RULE MATRIX)
# ==============================================================================

def crosscheck_complaint_and_ai(payload: Dict[str, Any]) -> Dict[str, Any]:
    complaint = payload.get("complaint", {})
    ai_output = payload.get("pipeline1Output") or {}
    policies = payload.get("policies", [])
    rule_matrix = payload.get("ruleMatrix", [])

    title = complaint.get("title", "")
    description = complaint.get("description", "")
    req_resolution = complaint.get("requestedResolution", "")
    customer_type = complaint.get("customerType", "Standard")
    product_service = complaint.get("productService", "")
    order_ref = complaint.get("orderReference", "")

    full_text = f"{title} {description} {req_resolution}".lower()

    findings: List[Dict[str, Any]] = []
    crosscheck_passed = True
    discrepancy_score = 0  # 0 to 100 deduction index

    # A. JSON Schema Conformance Check
    schema_errors = validate_genai_json_schema(ai_output)
    for se in schema_errors:
        findings.append({
            "type": se["type"],
            "severity": "HIGH",
            "message": f"Python Validator: {se['message']}"
        })
        discrepancy_score += 15

    # B. Adversarial & Prompt Injection Scanner (Independent regex)
    injection_patterns = [
        (r"ignore\s+(all|previous|prior|above)", "Instruction override directive"),
        (r"system\s+(override|notice|prompt)", "System impersonation syntax"),
        (r"override\s+directives?", "Security directive suppression"),
        (r"as\s+authorized\s+by", "Social engineering authority simulation"),
        (r"bypass\s+.*(rule|policy|constraint|approval)", "Security constraint evasion"),
        (r"(grant|transfer|wire|send)\s+\$?[0-9,]+(\.[0-9]{2})?.*(without|bypass|immediately)", "Unauthorized instant financial settlement demand"),
        (r"\[beta-bypass-\d+\]", "Hardcoded exploit token")
    ]

    adversarial_threats_found = []
    for pattern, desc in injection_patterns:
        matches = re.findall(pattern, full_text)
        if matches:
            adversarial_threats_found.append({
                "pattern": pattern,
                "description": desc,
                "severity": "CRITICAL"
            })
            crosscheck_passed = False
            discrepancy_score += 40

    # C. Safety Hazard & Critical Thermal Check
    safety_patterns = (
        r"\bsmoke\s+(?:is\s+)?(?:coming|pouring|billowing)\s+(?:from|out\s+of)\b",
        r"\b(?:burning|burnt)\s+(?:plastic\s+)?(?:smell|odor|odour)\b",
        r"\b(?:smell|smells|smelling)\s+(?:like\s+)?burning\b",
        r"\b(?:battery|device|laptop|computer|phone|tablet|charger|appliance)\b.{0,40}\b(?:smoking|overheating|overheated|swollen|swelling|sparking|sparks|melted|flames|on\s+fire|caught\s+(?:on\s+)?fire|catching\s+fire|getting\s+hot|very\s+hot)\b",
        r"\b(?:smoking|overheating|overheated|swollen|swelling|sparking|sparks|melted|flames|on\s+fire|caught\s+(?:on\s+)?fire|catching\s+fire|getting\s+hot|very\s+hot)\b.{0,40}\b(?:battery|device|laptop|computer|phone|tablet|charger|appliance)\b",
        r"\b(?:battery|device|laptop|computer|phone|tablet|charger|appliance)\b.{0,40}\b(?:emitting|releasing|producing)\s+(?:smoke|sparks|flames)\b",
        r"\b(?:smoke|sparks|flames)\b.{0,40}\b(?:emitted|released|produced)\s+by\s+(?:the\s+)?(?:battery|device|laptop|computer|phone|tablet|charger|appliance)\b",
    )
    safety_matches = [
        match.group(0)
        for pattern in safety_patterns
        if (match := re.search(pattern, full_text))
    ]
    has_safety = bool(safety_matches)

    ai_urgency = ai_output.get("urgency", "Low")
    ai_priority = ai_output.get("priority", "P4")
    ai_dept = ai_output.get("recommendedDepartment", "")
    ai_escalation = ai_output.get("escalationRequired", False)
    ai_draft = ai_output.get("draftedResponse", "")

    if has_safety:
        if ai_urgency != "Critical":
            findings.append({
                "type": "SAFETY_URGENCY_MISMATCH",
                "severity": "CRITICAL",
                "message": f"Python Validator: Safety hazard phrases detected ({safety_matches}), but AI assigned non-critical urgency '{ai_urgency}'. Ground-truth requires CRITICAL."
            })
            crosscheck_passed = False
            discrepancy_score += 35

        if ai_priority != "P1":
            findings.append({
                "type": "SAFETY_PRIORITY_MISMATCH",
                "severity": "HIGH",
                "message": f"Python Validator: Safety hazard requires priority P1, but AI assigned '{ai_priority}'."
            })
            discrepancy_score += 15

        # Check safety warning in drafted response
        safety_words = ["disconnect", "unplug", "power", "safe", "hazard", "combustible", "flammable", "cease"]
        has_warning = any(w in ai_draft.lower() for w in safety_words)
        if not has_warning:
            findings.append({
                "type": "MISSING_MANDATORY_SAFETY_WARNING",
                "severity": "CRITICAL",
                "message": "Python Validator: AI customer response lacks mandatory safety warning (disconnect power, isolate from flammable items)."
            })
            crosscheck_passed = False
            discrepancy_score += 25

    # D. Legal / Litigation Threat Check
    legal_pattern = re.compile(
        r"\b(?:lawsuits?|attorneys?|lawyers?|sue|sues|sued|suing|courts?|ftc|cfpb|litigation|statutory\s+notice|counsel)\b"
    )
    has_legal = bool(legal_pattern.search(full_text))

    if has_legal:
        if "legal" not in ai_dept.lower() and "compliance" not in ai_dept.lower():
            findings.append({
                "type": "LEGAL_ROUTING_MISMATCH",
                "severity": "CRITICAL",
                "message": f"Python Validator: Customer explicitly cited legal/regulatory action. Must route to 'Legal & Compliance', but AI selected '{ai_dept}'."
            })
            crosscheck_passed = False
            discrepancy_score += 30

        if not ai_escalation:
            findings.append({
                "type": "MANDATORY_LEGAL_ESCALATION_OMITTED",
                "severity": "HIGH",
                "message": "Python Validator: Mandatory escalation flag omitted by AI for formal litigation threat."
            })
            discrepancy_score += 20

    # E. Policy Constraint Validation & Unsupported Promise Auditing
    is_late_refund = any(phrase in full_text for phrase in ["90 day", "3 month", "11 month", "last year", "6 month", "past 30 days"])
    if is_late_refund and ("refund" in full_text or "cash back" in full_text):
        draft_lower = ai_draft.lower()
        unsupported_phrases = ["full refund will be issued", "sending a 100% refund", "refund of $", "refund has been authorized", "approved your refund"]
        has_unsupported_promise = any(up in draft_lower for up in unsupported_phrases)

        if has_unsupported_promise:
            findings.append({
                "type": "UNSUPPORTED_REFUND_PROMISE",
                "severity": "CRITICAL",
                "message": "Python Validator: Order exceeds 30-day return window (POL-RET-01 Sec 01), but AI draft promised a refund without manager/director signoff."
            })
            crosscheck_passed = False
            discrepancy_score += 40

    # F. Unauthorized Compensation Detection
    comp_matches = re.findall(r"\$\s*([0-9]+)", ai_draft)
    for amount_str in comp_matches:
        amount = int(amount_str)
        if amount > 150:
            findings.append({
                "type": "COMPENSATION_CEILING_EXCEEDED",
                "severity": "HIGH",
                "message": f"Python Validator: AI drafted compensation of ${amount}, exceeding Tier 1 limit of $150 (POL-RET-01 Sec 02)."
            })
            crosscheck_passed = False
            discrepancy_score += 25

    # G. Entity Consistency Cross-Check
    extracted_entities = ai_output.get("entities") or {}
    order_in_text = re.search(r"\b(ord-[a-z0-9\-]+|inv-[a-z0-9\-]+)\b", full_text, re.IGNORECASE)
    if order_in_text and order_ref:
        found_ref = order_in_text.group(0).upper()
        if extracted_entities.get("orderId") and extracted_entities.get("orderId").upper() != found_ref:
            findings.append({
                "type": "ENTITY_ORDER_MISMATCH",
                "severity": "MEDIUM",
                "message": f"Python Validator: Order reference mismatch in extraction (Found: {found_ref}, Extracted: {extracted_entities.get('orderId')})."
            })
            discrepancy_score += 10

    # H. Missing Information & Clarification Question Crosscheck
    if not order_ref and not order_in_text and any(w in full_text for w in ["order", "shipped", "tracking", "refund"]):
        clarif = ai_output.get("clarificationQuestions") or []
        if not clarif:
            findings.append({
                "type": "MISSING_CLARIFICATION_QUESTIONS",
                "severity": "MEDIUM",
                "message": "Python Validator: Complaint refers to an order but omits order reference; AI failed to generate clarification questions."
            })
            discrepancy_score += 10

    # Calculate Python Crosscheck Confidence Score (0 - 100)
    validation_score = max(0, 100 - discrepancy_score)
    if adversarial_threats_found:
        validation_score = min(validation_score, 25)
        crosscheck_passed = False

    status = "Validated" if (crosscheck_passed and validation_score >= 80) else "Crosscheck Flagged"

    return {
        "engine": "Python 3.10 Ground-Truth Validator",
        "status": status,
        "validationScore": validation_score,
        "passed": crosscheck_passed,
        "adversarialThreats": adversarial_threats_found,
        "findings": findings,
        "timestamp": payload.get("timestamp", "")
    }


# ==============================================================================
# MAIN ROUTING DISPATCHER
# ==============================================================================

def main():
    try:
        raw_input = sys.stdin.read()
        if not raw_input.strip():
            print(json.dumps({"error": "Empty input payload"}))
            sys.exit(1)

        payload = json.loads(raw_input)
        action = payload.get("action", "")

        if action == "parse_document" or "filename" in payload:
            result = validate_and_parse_document(payload)
        else:
            result = crosscheck_complaint_and_ai(payload)

        print(json.dumps(result, indent=2))
    except Exception as e:
        print(json.dumps({
            "error": str(e),
            "engine": "Python 3.10 Ground-Truth Validator",
            "status": "Execution Error",
            "passed": False
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()
