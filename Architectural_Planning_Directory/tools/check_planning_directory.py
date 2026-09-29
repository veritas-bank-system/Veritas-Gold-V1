#!/usr/bin/env python3
"""Check internal Markdown links and index coverage for the planning directory.

External URLs are intentionally not fetched. The directory README is the index;
every other Markdown file inside the directory must be linked from it.
"""

from __future__ import annotations

import argparse
import re
import sys
import tempfile
import unittest
from pathlib import Path
from urllib.parse import unquote, urlsplit

LINK_RE = re.compile(r"!?\[[^\]]*\]\(\s*(<[^>]+>|[^)\s]+)(?:\s+[^)]*)?\)")
HEADING_RE = re.compile(r"^#{1,6}\s+(.+?)\s*#*\s*$")
HTML_ID_RE = re.compile(r"\bid\s*=\s*['\"]([^'\"]+)['\"]", re.IGNORECASE)


def github_heading_ids(markdown: str) -> set[str]:
    """Return GitHub-style IDs for ATX headings and explicit HTML IDs."""
    used: dict[str, int] = {}
    ids: set[str] = set()
    for line in markdown.splitlines():
        for match in HTML_ID_RE.finditer(line):
            ids.add(match.group(1))
        heading = HEADING_RE.match(line)
        if not heading:
            continue
        text = re.sub(r"`([^`]*)`", r"\1", heading.group(1))
        slug = re.sub(r"[^\w\- ]", "", text.lower(), flags=re.UNICODE)
        slug = re.sub(r"\s+", "-", slug.strip())
        occurrence = used.get(slug, 0)
        used[slug] = occurrence + 1
        ids.add(slug if occurrence == 0 else f"{slug}-{occurrence}")
    return ids


def markdown_files(directory: Path) -> list[Path]:
    return sorted(path for path in directory.rglob("*.md") if path.is_file())


def indexed_markdown_targets(index_path: Path, root: Path) -> set[Path]:
    """Collect local Markdown destinations linked from the index."""
    text = index_path.read_text(encoding="utf-8")
    targets: set[Path] = set()
    for match in LINK_RE.finditer(text):
        raw = match.group(1).strip("<>")
        parsed = urlsplit(raw)
        if parsed.scheme or parsed.netloc or not parsed.path.lower().endswith(".md"):
            continue
        target = (index_path.parent / unquote(parsed.path)).resolve()
        try:
            target.relative_to(root.resolve())
        except ValueError:
            continue
        targets.add(target)
    return targets


def check_links(directory: Path) -> list[str]:
    """Report missing local link targets and missing Markdown fragments."""
    errors: list[str] = []
    root = directory.resolve()
    for source in markdown_files(root):
        text = source.read_text(encoding="utf-8")
        for match in LINK_RE.finditer(text):
            raw = match.group(1).strip("<>")
            parsed = urlsplit(raw)
            if parsed.scheme or parsed.netloc:
                continue
            target = (
                source.resolve()
                if not parsed.path
                else (source.parent / unquote(parsed.path)).resolve()
            )
            try:
                target.relative_to(root)
            except ValueError:
                # Links may intentionally point to repository sources outside this archive.
                if not target.exists():
                    errors.append(f"{source.relative_to(root)}: missing link target: {unquote(parsed.path)}")
                continue
            if target.is_dir():
                candidates = [target / "README.md", target / "index.md"]
                target = next((candidate for candidate in candidates if candidate.is_file()), target)
            if not target.exists():
                errors.append(f"{source.relative_to(root)}: missing link target: {unquote(parsed.path)}")
                continue
            fragment = unquote(parsed.fragment)
            if fragment and target.suffix.lower() == ".md":
                target_text = target.read_text(encoding="utf-8")
                if fragment not in github_heading_ids(target_text):
                    errors.append(
                        f"{source.relative_to(root)}: missing fragment #{fragment} in "
                        f"{target.relative_to(root) if target.is_relative_to(root) else target}"
                    )
    return errors


def check_index_coverage(directory: Path, index_path: Path) -> list[str]:
    """Report Markdown documents in the directory absent from its README index."""
    root = directory.resolve()
    index = index_path.resolve()
    indexed = indexed_markdown_targets(index, root)
    errors: list[str] = []
    for document in markdown_files(root):
        if document.resolve() == index:
            continue
        if document.resolve() not in indexed:
            errors.append(f"not indexed: {document.relative_to(root)}")
    return errors


def run_checks(directory: Path, index_path: Path) -> int:
    if not directory.is_dir():
        print(f"ERROR: planning directory does not exist: {directory}", file=sys.stderr)
        return 2
    if not index_path.is_file():
        print(f"ERROR: planning index does not exist: {index_path}", file=sys.stderr)
        return 2

    link_errors = check_links(directory)
    coverage_errors = check_index_coverage(directory, index_path)
    print(f"Planning Markdown files checked: {len(markdown_files(directory))}")
    print(f"Broken local links/fragments: {len(link_errors)}")
    for error in link_errors:
        print(f"  - {error}")
    print(f"Markdown files missing from index: {len(coverage_errors)}")
    for error in coverage_errors:
        print(f"  - {error}")
    if link_errors or coverage_errors:
        return 1
    print("PASS: all local Markdown links resolve and all planning Markdown is indexed.")
    return 0


class CheckerSelfTests(unittest.TestCase):
    def test_detects_missing_file_and_fragment(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / "planning"
            root.mkdir()
            (root / "README.md").write_text(
                "[ok](note.md#good) [bad file](absent.md) [bad fragment](note.md#missing)\n",
                encoding="utf-8",
            )
            (root / "note.md").write_text("# Good\n", encoding="utf-8")
            errors = check_links(root)
            self.assertEqual(len(errors), 2)
            self.assertTrue(any("absent.md" in error for error in errors))
            self.assertTrue(any("#missing" in error for error in errors))

    def test_detects_unindexed_markdown(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / "planning"
            root.mkdir()
            index = root / "README.md"
            index.write_text("[Listed](listed.md)\n", encoding="utf-8")
            (root / "listed.md").write_text("# Listed\n", encoding="utf-8")
            (root / "unlisted.md").write_text("# Unlisted\n", encoding="utf-8")
            errors = check_index_coverage(root, index)
            self.assertEqual(errors, ["not indexed: unlisted.md"])


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--directory", type=Path, help="Planning directory (defaults to this script's parent)")
    parser.add_argument("--index", type=Path, help="Index Markdown file (defaults to DIRECTORY/README.md)")
    parser.add_argument("--self-test", action="store_true", help="Run isolated checker tests and exit")
    args = parser.parse_args()

    if args.self_test:
        suite = unittest.defaultTestLoader.loadTestsFromTestCase(CheckerSelfTests)
        result = unittest.TextTestRunner(verbosity=2).run(suite)
        return 0 if result.wasSuccessful() else 1

    directory = (args.directory or Path(__file__).resolve().parents[1]).resolve()
    index = (args.index or directory / "README.md").resolve()
    return run_checks(directory, index)


if __name__ == "__main__":
    raise SystemExit(main())
