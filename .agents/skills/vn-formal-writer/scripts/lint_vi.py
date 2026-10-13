#!/usr/bin/env python3
"""Kiểm tra văn bản tiếng Việt formal theo quy tắc của skill vn-formal-writer.

Cách dùng:
    python lint_vi.py duong_dan_file.md
    python lint_vi.py duong_dan_file.md --strict   (cảnh báo cũng làm lệnh thoát lỗi)
    cat file.md | python lint_vi.py

Mức LỖI: phải sửa. Mức CẢNH BÁO: cần xem từng trường hợp.
Script chỉ bắt dấu hiệu bề mặt, không thay thế việc đọc lại.
"""
import re
import sys
import unicodedata
from collections import Counter
from statistics import mean, pstdev

EMOJI_RE = re.compile(
    "[\U0001F000-\U0001FAFF←-⇿⌀-⏿①-⓿"
    "■-➿⤀-⥿⬀-⯿️‍]"
)
DASH_RE = re.compile("[‒–—―−]|--")
SPACED_HYPHEN_RE = re.compile(r"\S\s-\s\S")
RULE_LINE_RE = re.compile(r"^[\s|:\-=_*]+$")
HEADING_MD_RE = re.compile(r"^\s{0,3}#{1,6}\s+(.*?)\s*#*\s*$")
HEADING_NUM_RE = re.compile(r"^\s*\d+(?:\.\d+)+\.?\s+(.+)$")
CAPTION_RE = re.compile(r"^\s*(?:Bảng|Hình|Biểu đồ|Sơ đồ)\s+\d+(?:\.\d+)*\s*[.:]\s*(.+)$")
LIST_MARK_RE = re.compile(r"^\s*(?:[-*+•]\s+|\d+[.)]\s+)")
LEAD_MARK_RE = re.compile(r"^\s*(?:[-*+•]\s+|\d+[.)]\s+|>\s*)")

PUNCT = ".,;:!?()[]{}\"'“”‘’«»…*_"

COMMON_PHRASES = {
    "hệ thống", "người dùng", "dữ liệu", "phần mềm", "kiểm thử", "yêu cầu",
    "chức năng", "quy trình", "phương pháp", "kết quả", "thiết kế",
    "trường hợp", "giao diện", "ứng dụng", "cơ sở", "mô hình",
}

CLICHES = [
    r"trong bối cảnh", r"trong thời đại", r"kỷ nguyên số", r"thời đại 4\.0",
    r"cách mạng công nghiệp", r"ngày càng (?:phát triển|gia tăng|quan trọng)",
    r"đóng vai trò (?:quan trọng|then chốt|thiết yếu|chủ chốt)",
    r"vô cùng quan trọng", r"hết sức quan trọng", r"không thể phủ nhận",
    r"không khó để (?:nhận thấy|thấy)", r"cần lưu ý rằng", r"đáng chú ý",
    r"điều quan trọng là", r"có thể thấy rằng", r"như vậy có thể thấy",
    r"nhìn chung", r"tóm lại", r"tựu trung", r"bức tranh toàn cảnh",
    r"hành trình", r"toàn diện", r"đa chiều", r"đa dạng và phong phú",
    r"góp phần (?:quan trọng|to lớn)", r"mang lại (?:nhiều )?giá trị",
    r"nâng cao hiệu quả", r"tối ưu hóa",
    r"một cách (?:hiệu quả|toàn diện|tối ưu|đáng kể)",
    r"không chỉ .{1,80}? mà còn", r"chìa khóa", r"yếu tố then chốt",
    r"mở ra (?:nhiều )?(?:cơ hội|cánh cửa)", r"cung cấp một cái nhìn",
    r"dưới đây là", r"hãy cùng", r"hơn bao giờ hết", r"tiềm năng to lớn",
    r"sâu sắc", r"đột phá", r"mạnh mẽ", r"không chỉ dừng lại",
    r"cốt lõi", r"tắc nghẽn", r"tắt nghẽn", r"điểm đau", r"nỗi đau",
    r"nút thắt(?: cổ chai)?",
]
CLICHE_RES = [re.compile(p) for p in CLICHES]

MAX_PER_KIND = 12


def clean_lines(text):
    """Trả về danh sách (số dòng, dòng đã bỏ code, URL, frontmatter)."""
    lines = text.splitlines()
    out = []
    in_code = False
    i = 0
    if lines and lines[0].strip() == "---":
        j = 1
        while j < len(lines) and lines[j].strip() != "---":
            j += 1
        for k in range(min(j + 1, len(lines))):
            out.append((k + 1, ""))
        i = j + 1
    for idx in range(i, len(lines)):
        line = lines[idx]
        n = idx + 1
        if line.strip().startswith("```"):
            in_code = not in_code
            out.append((n, ""))
            continue
        if in_code:
            out.append((n, ""))
            continue
        line = re.sub(r"`[^`]*`", "", line)
        line = re.sub(r"https?://\S+", "", line)
        out.append((n, line))
    return out


def core(tok):
    return tok.strip(PUNCT)


def is_cap(c):
    return len(c) >= 1 and c[0].isupper() and not c.isupper()


def has_viet_mark(word):
    nfd = unicodedata.normalize("NFD", word)
    return any(unicodedata.combining(ch) for ch in nfd)


def title_case_level(text):
    words = re.findall(r"[^\W\d_][\w'’-]*", text)
    rest = words[1:]
    if len(rest) < 2:
        return None
    caps = sum(1 for w in rest if is_cap(w))
    ratio = caps / len(rest)
    if caps >= 3 and ratio >= 0.8:
        return "LỖI"
    if caps >= 2 and ratio > 0.6:
        return "CẢNH BÁO"
    return None


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    strict = "--strict" in sys.argv
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    if args:
        with open(args[0], encoding="utf-8") as f:
            text = f.read()
    else:
        text = sys.stdin.read()

    issues = []

    def add(level, n, msg):
        issues.append((level, n, msg))

    body_for_rhythm = []
    total_words = 0
    bold_count = 0
    nonempty = 0
    list_lines = 0

    for n, line in clean_lines(text):
        if not line.strip() or RULE_LINE_RE.match(line):
            continue
        is_table = "|" in line
        m_head = HEADING_MD_RE.match(line)
        m_num = HEADING_NUM_RE.match(line) if not m_head else None
        m_cap = CAPTION_RE.match(line)
        heading_text = None
        if m_head:
            heading_text = m_head.group(1)
        elif m_num and len(line) <= 140 and not line.rstrip().endswith("."):
            heading_text = m_num.group(1)
        elif m_cap:
            heading_text = m_cap.group(1)
        is_heading = heading_text is not None

        # Kiểm tra áp dụng cho mọi dòng
        if EMOJI_RE.search(line):
            add("LỖI", n, "có emoji hoặc ký hiệu trang trí")
        if DASH_RE.search(line):
            add("LỖI", n, "có gạch ngang dài hoặc hai gạch nối liên tiếp")
        if not is_table and SPACED_HYPHEN_RE.search(line):
            add("LỖI", n, "gạch nối có khoảng trắng hai bên dùng như dấu ngắt câu")
        if "!" in line and "!=" not in line:
            add("LỖI", n, "có dấu chấm than")

        if is_heading:
            lvl = title_case_level(heading_text)
            if lvl and not heading_text.isupper():
                add(lvl, n, "tiêu đề có dấu hiệu Title Case: " + heading_text)
            continue

        nonempty += 1
        if LIST_MARK_RE.match(line):
            list_lines += 1

        if is_table:
            continue

        plain = LEAD_MARK_RE.sub("", line)
        plain = plain.replace("**", " ").replace("__", " ")
        bold_count += len(re.findall(r"\*\*[^*]+\*\*", line))
        words_in_line = plain.split()
        total_words += len(words_in_line)
        if not LIST_MARK_RE.match(line):
            body_for_rhythm.append(plain.strip())

        # Cụm sáo rỗng
        low = plain.lower()
        seen = set()
        for rx in CLICHE_RES:
            for mm in rx.finditer(low):
                key = mm.group(0)
                if key not in seen:
                    seen.add(key)
                    add("CẢNH BÁO", n, "cụm sáo rỗng: " + key)

        # Kiểm tra theo từ
        tokens = plain.split()
        whole_upper = plain.strip().isupper()
        # Từ in hoa có dấu tiếng Việt là dấu hiệu nhấn mạnh; mở rộng sang các từ in hoa kề bên
        emph = set()
        for k, tk in enumerate(tokens):
            ck = core(tk)
            if (len(ck) >= 2 and ck.isupper() and has_viet_mark(ck)
                    and "-" not in ck and "/" not in ck):
                emph.add(k)
        grew = True
        while grew and emph:
            grew = False
            for k in list(emph):
                for nb in (k - 1, k + 1):
                    if 0 <= nb < len(tokens) and nb not in emph:
                        cn = core(tokens[nb])
                        if len(cn) >= 2 and cn.isalpha() and cn.isupper():
                            emph.add(nb)
                            grew = True
        i = 0
        while i < len(tokens):
            c = core(tokens[i])
            start = (i == 0) or tokens[i - 1].rstrip().endswith((".", "!", "?"))
            after_colon = i > 0 and tokens[i - 1].endswith(":")

            # Viết hoa cả từ để nhấn mạnh
            if not whole_upper and i in emph:
                add("LỖI", n, "viết hoa cả từ để nhấn mạnh: " + c)

            # Danh từ chung bị viết hoa giữa câu
            if not start and c and c[0].isupper() and not c.isupper():
                pair = ""
                if i + 1 < len(tokens):
                    pair = (c + " " + core(tokens[i + 1])).lower()
                if pair in COMMON_PHRASES or c.lower() in COMMON_PHRASES:
                    add("LỖI", n, "danh từ chung bị viết hoa giữa câu: " + c)

            if after_colon and is_cap(c):
                add("CẢNH BÁO", n, "viết hoa sau dấu hai chấm: " + c)

            # Chuỗi từ viết hoa liên tiếp giữa câu
            if not start and is_cap(c):
                j = i
                run = []
                while j < len(tokens) and is_cap(core(tokens[j])):
                    run.append(core(tokens[j]))
                    if tokens[j].rstrip()[-1:] in ",.;:!?":
                        break
                    j += 1
                if len(run) >= 3:
                    add("CẢNH BÁO", n,
                        "chuỗi từ viết hoa (rà soát, có thể là tên riêng hợp lệ): "
                        + " ".join(run))
                i = max(j, i) + 1
                continue
            i += 1

        # Khoảng trắng và dấu câu
        if re.search(r"\s+[,.;:!?]", plain) and "..." not in plain:
            add("CẢNH BÁO", n, "khoảng trắng đứng trước dấu câu")
        if re.search(r"[,;](?=[^\s\d\"”\)\]])", plain):
            add("CẢNH BÁO", n, "thiếu khoảng trắng sau dấu phẩy hoặc chấm phẩy")
        if re.search(r"\S {2,}\S", plain):
            add("CẢNH BÁO", n, "có khoảng trắng đôi")

    # Thống kê nhịp câu
    para = " ".join(body_for_rhythm)
    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", para) if s.strip()]
    lengths = [len(s.split()) for s in sentences]
    stat_line = None
    if len(sentences) >= 8:
        mu = mean(lengths)
        sd = pstdev(lengths)
        cv = sd / mu if mu else 0
        stat_line = "Thống kê: %d câu, trung bình %.1f từ mỗi câu, hệ số biến thiên %.2f" % (
            len(sentences), mu, cv)
        if cv < 0.30:
            add("CẢNH BÁO", 0, "nhịp câu quá đều (hệ số biến thiên %.2f, nên từ 0,35 trở lên)" % cv)
        if mu > 35:
            add("CẢNH BÁO", 0, "câu trung bình quá dài (%.1f từ)" % mu)
        openers = Counter(s.split()[0].lower().strip(PUNCT) for s in sentences if s.split())
        top, cnt = openers.most_common(1)[0]
        if cnt >= 4 and cnt / len(sentences) >= 0.25:
            add("CẢNH BÁO", 0, "lặp cách mở câu: '%s' mở %d trên %d câu" % (top, cnt, len(sentences)))
    long_sents = [s for s in sentences if len(s.split()) > 60]
    for s in long_sents[:5]:
        add("CẢNH BÁO", 0, "câu dài hơn 60 từ: " + " ".join(s.split()[:8]) + " ...")

    if bold_count > max(3, total_words / 200):
        add("CẢNH BÁO", 0, "in đậm nhiều (%d chỗ), báo cáo học thuật hầu như không in đậm trong thân đoạn" % bold_count)
    if nonempty >= 10 and list_lines / nonempty > 0.4:
        add("CẢNH BÁO", 0, "tỷ lệ dòng gạch đầu dòng cao (%d trên %d dòng), nên chuyển lập luận thành văn xuôi" % (list_lines, nonempty))

    # In kết quả
    errors = [x for x in issues if x[0] == "LỖI"]
    warns = [x for x in issues if x[0] == "CẢNH BÁO"]
    for label, group in (("LỖI", errors), ("CẢNH BÁO", warns)):
        shown = 0
        for level, n, msg in group:
            if shown >= MAX_PER_KIND * 4:
                print("%s: còn %d mục nữa chưa hiển thị" % (label, len(group) - shown))
                break
            where = "dòng %d" % n if n else "toàn văn"
            print("%s %s: %s" % (label, where, msg))
            shown += 1
    if stat_line:
        print(stat_line)
    print("Tổng: %d lỗi, %d cảnh báo" % (len(errors), len(warns)))
    if errors or (strict and warns):
        sys.exit(1)


if __name__ == "__main__":
    main()
