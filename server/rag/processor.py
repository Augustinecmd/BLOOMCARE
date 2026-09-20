"""Medical Document Processor & Text Chunking Engine for BloomCare RAG.

Extracts structured sections and chunks from medical markdown documents
and JSON knowledge bases, preserving clinical metadata, tags, and source attribution.
"""
from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional


@dataclass
class DocumentChunk:
    chunk_id: str
    doc_id: str
    title: str
    category: str
    section: str
    content: str
    tags: List[str] = field(default_factory=list)
    source_name: str = "BloomCare Medical Knowledge Base"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "chunk_id": self.chunk_id,
            "doc_id": self.doc_id,
            "title": self.title,
            "category": self.category,
            "section": self.section,
            "content": self.content,
            "tags": self.tags,
            "source_name": self.source_name,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> DocumentChunk:
        return cls(
            chunk_id=data["chunk_id"],
            doc_id=data.get("doc_id", "doc-unknown"),
            title=data.get("title", ""),
            category=data.get("category", "general"),
            section=data.get("section", ""),
            content=data.get("content", ""),
            tags=data.get("tags", []),
            source_name=data.get("source_name", "BloomCare Medical Knowledge Base"),
        )


class MedicalDocumentProcessor:
    """Processes markdown and JSON files into indexable semantic chunks."""

    def __init__(self, documents_dir: Optional[Path] = None, json_knowledge_file: Optional[Path] = None):
        base_dir = Path(__file__).parent
        self.documents_dir = documents_dir or (base_dir / "documents")
        self.json_knowledge_file = json_knowledge_file or (base_dir.parent / "data" / "medical_knowledge.json")

    def load_all_chunks(self) -> List[DocumentChunk]:
        """Loads and chunks all medical documents and JSON knowledge."""
        chunks: List[DocumentChunk] = []

        # 1. Process Markdown files in documents_dir
        if self.documents_dir.exists():
            for md_path in sorted(self.documents_dir.glob("*.md")):
                try:
                    file_chunks = self.process_markdown_file(md_path)
                    chunks.extend(file_chunks)
                except Exception as e:
                    print(f"[RAG Processor] Error processing {md_path.name}: {e}")

        # 2. Ingest structured medical_knowledge.json
        if self.json_knowledge_file and self.json_knowledge_file.exists():
            try:
                json_chunks = self.process_json_knowledge(self.json_knowledge_file)
                chunks.extend(json_chunks)
            except Exception as e:
                print(f"[RAG Processor] Error processing JSON knowledge: {e}")

        return chunks

    def process_markdown_file(self, file_path: Path) -> List[DocumentChunk]:
        """Parses a markdown file by headers and chunks each section."""
        text = file_path.read_text(encoding="utf-8")
        doc_id = file_path.stem
        lines = text.splitlines()

        doc_title = file_path.stem.replace("_", " ").title()
        chunks: List[DocumentChunk] = []
        current_section = ""
        current_lines: List[str] = []
        chunk_idx = 0

        for line in lines:
            if line.startswith("# "):
                doc_title = line.replace("# ", "").strip()
            elif line.startswith("## "):
                # Flush previous section
                if current_section and current_lines:
                    chunk = self._create_chunk(
                        doc_id=doc_id,
                        doc_title=doc_title,
                        section=current_section,
                        content="\n".join(current_lines).strip(),
                        chunk_idx=chunk_idx,
                    )
                    if chunk:
                        chunks.append(chunk)
                        chunk_idx += 1
                current_section = line.replace("## ", "").strip()
                current_lines = []
            else:
                current_lines.append(line)

        # Flush final section
        if current_section and current_lines:
            chunk = self._create_chunk(
                doc_id=doc_id,
                doc_title=doc_title,
                section=current_section,
                content="\n".join(current_lines).strip(),
                chunk_idx=chunk_idx,
            )
            if chunk:
                chunks.append(chunk)

        return chunks

    def _create_chunk(self, doc_id: str, doc_title: str, section: str, content: str, chunk_idx: int) -> Optional[DocumentChunk]:
        if not content.strip():
            return None

        tags = self._extract_tags(section, content)
        category = doc_id.replace("_", " ").title()

        return DocumentChunk(
            chunk_id=f"{doc_id}_{chunk_idx}",
            doc_id=doc_id,
            title=f"{section} - {doc_title}",
            category=category,
            section=section,
            content=content,
            tags=tags,
            source_name=f"BloomCare Medical Knowledge Base ({doc_title})",
        )

    def process_json_knowledge(self, json_path: Path) -> List[DocumentChunk]:
        """Converts structured medical_knowledge.json entries into RAG chunks."""
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        chunks: List[DocumentChunk] = []

        # Process Condition Monographs
        for key, cond in data.get("conditions", {}).items():
            content_parts = [
                f"Medical Condition: {cond.get('name', key)}",
                f"What it means: {cond.get('overview', '')}",
                "Common symptoms: " + ", ".join(cond.get("common_symptoms", [])),
                "Self-care & management: " + ", ".join(cond.get("what_you_can_do", [])),
                "When to seek clinical care: " + ", ".join(cond.get("when_to_seek_care", [])),
            ]
            if cond.get("clarificationQuestions"):
                content_parts.append("Clarifications: " + ", ".join(cond.get("clarificationQuestions", [])))

            chunks.append(
                DocumentChunk(
                    chunk_id=f"json_cond_{key}",
                    doc_id="medical_knowledge_json",
                    title=cond.get("name", key),
                    category="Diseases and Symptoms",
                    section=cond.get("name", key),
                    content="\n".join(content_parts),
                    tags=[key, cond.get("name", "").lower(), "condition", "disease", "symptom"],
                    source_name="BloomCare Clinical Dispensary Protocols",
                )
            )

        # Process Medicines Monographs
        for key, med in data.get("medicines", {}).items():
            content_parts = [
                f"Medication: {med.get('name', key)} ({med.get('genericName', '')})",
                f"Class: {med.get('drugClass', '')} | Status: {med.get('prescriptionStatus', 'OTC')}",
                f"Indications & Uses: {med.get('uses', '')}",
                f"Mechanism: {med.get('mechanism', '')}",
                "Common Side Effects: " + ", ".join(med.get("sideEffects", [])),
                "Important Precautions: " + ", ".join(med.get("precautions", [])),
            ]
            chunks.append(
                DocumentChunk(
                    chunk_id=f"json_med_{key}",
                    doc_id="medical_knowledge_json",
                    title=f"{med.get('name', key)} Monograph",
                    category="Medicines",
                    section=med.get("name", key),
                    content="\n".join(content_parts),
                    tags=[key, med.get("name", "").lower(), med.get("genericName", "").lower(), "drug", "medicine", "rx"],
                    source_name="BloomCare Official Drug Monograph",
                )
            )

        # Process First Aid
        for key, fa in data.get("firstAid", {}).items():
            content_parts = [
                f"First Aid Protocol: {fa.get('title', key)}",
                "Action Steps:\n" + "\n".join(f"• {s}" for s in fa.get("immediateSteps", [])),
                "Contraindications (Avoid):\n" + "\n".join(f"• {a}" for a in fa.get("avoid", [])),
                "When to go to hospital: " + ", ".join(fa.get("redFlags", [])),
            ]
            chunks.append(
                DocumentChunk(
                    chunk_id=f"json_firstaid_{key}",
                    doc_id="medical_knowledge_json",
                    title=fa.get("title", key),
                    category="First Aid",
                    section=fa.get("title", key),
                    content="\n".join(content_parts),
                    tags=[key, fa.get("title", "").lower(), "first aid", "emergency"],
                    source_name="BloomCare Emergency First Aid Guide",
                )
            )

        # Process Medical Glossary
        for term, desc in data.get("medicalGlossary", {}).items():
            chunks.append(
                DocumentChunk(
                    chunk_id=f"json_glossary_{term}",
                    doc_id="medical_knowledge_json",
                    title=f"Term: {term.title()}",
                    category="Medical Glossary",
                    section=term.title(),
                    content=f"Medical Term: {term}\nDefinition: {desc}",
                    tags=[term.lower(), "definition", "glossary", "terminology"],
                    source_name="BloomCare Pharmacy Glossary",
                )
            )

        return chunks

    def _extract_tags(self, section: str, content: str) -> List[str]:
        words = re.findall(r"\b[a-zA-Z]{3,}\b", (section + " " + content).lower())
        stop = {
            "and", "the", "for", "with", "that", "this", "from", "are", "can", "may",
            "not", "all", "dose", "use", "take", "used", "also", "into", "when", "more"
        }
        seen = set()
        tags = []
        for w in words:
            if w not in stop and w not in seen:
                seen.add(w)
                tags.append(w)
                if len(tags) >= 15:
                    break
        return tags

