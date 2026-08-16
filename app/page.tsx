"use client";

import React, { useState } from "react";

const DEMO_BOOKS = [
  { id: "000035", title: "走れメロス", author: "太宰治", textUrl: "https://www.aozora.gr.jp/cards/000035/files/1567_14913.html" },
  { id: "000119", title: "山月記", author: "中島敦", textUrl: "https://www.aozora.gr.jp/cards/000119/files/624_14544.html" },
  { id: "001095", title: "将棋", author: "坂口安吾", textUrl: "https://www.aozora.gr.jp/cards/001095/files/42835_27735.html" },
  { id: "000148", title: "吾輩は猫である", author: "夏目漱石", textUrl: "https://www.aozora.gr.jp/cards/000148/files/789_14547.html" }
];

export default function AozoraApp() {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState(DEMO_BOOKS);
  const [loading, setLoading] = useState(false);
  
  // ページング管理用ステート
  const [pages, setPages] = useState<string[]>(["左のリストから作品を選ぶと、ここに本文が表示されます。"]);
  const [currentPage, setCurrentPage] = useState(0);

  const searchBooks = () => {
    const filtered = DEMO_BOOKS.filter(
      b => b.title.includes(keyword) || b.author.includes(keyword)
    );
    setResults(filtered.length > 0 ? filtered : DEMO_BOOKS);
  };

  // テキストを一定文字数ごとにページ分割する関数
  const splitIntoPages = (fullText: string, charPerPage: number = 500) => {
    // 青空文庫の注記（［＃…］など）を綺麗に削除
    const cleaned = fullText
      .replace(/［＃.*?］/g, "")
      .replace(/〔.*?〕/g, "");

    const paragraphs = cleaned.split("\n");
    const bookPages: string[] = [];
    let currentPageText = "";

    for (const p of paragraphs) {
      if ((currentPageText + p).length > charPerPage) {
        if (currentPageText) bookPages.push(currentPageText);
        currentPageText = p + "\n";
      } else {
        currentPageText += p + "\n";
      }
    }
    if (currentPageText) {
      bookPages.push(currentPageText);
    }
    return bookPages.length > 0 ? bookPages : [cleaned];
  };

  const fetchBookText = async (url: string) => {
    setPages(["作品データを読み込んでいます..."]);
    setCurrentPage(0);
    try {
      const res = await fetch(`/api/aozora?url=${encodeURIComponent(url)}`);
      
      if (!res.ok) throw new Error("データの取得に失敗しました");
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // 読み込んだテキストをページごとに分割してセット（必ず1ページ目＝冒頭から）
      const bookPages = splitIntoPages(data.text);
      setPages(bookPages);
      setCurrentPage(0);
    } catch (error) {
      console.error("Fetch error:", error);
      setPages(["読み込みに失敗しました。時間をおいてやり直してください。"]);
      setCurrentPage(0);
    }
  };

  // 青空文庫のルビ記号を HTML の <ruby> タグに変換する
  const parseAozoraText = (rawText: string) => {
    return rawText
      .replace(/｜([^《]+)《([^》]+)》/g, "<ruby>$1<rt>$2</rt></ruby>")
      .replace(/([一-龥々亜-ﾟ]+)《([^》]+)》/g, "<ruby>$1<rt>$2</rt></ruby>")
      .replace(/\n/g, "<br />");
  };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "sans-serif" }}>
      {/* 左サイドバー：検索・リストエリア */}
      <div className="no-print" style={{ width: "300px", padding: "20px", background: "#f5f5f5", borderRight: "1px solid #ddd", display: "flex", flexDirection: "column" }}>
        <h2 style={{ fontSize: "16px", marginTop: 0 }}>作品検索</h2>
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="例: 哲学、将棋、夏目漱石..."
            style={{ flex: 1, padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
          />
          <button onClick={searchBooks} style={{ padding: "8px", cursor: "pointer" }}>検索</button>
        </div>

        <ul style={{ listStyle: "none", padding: 0, margin: 0, overflowY: "auto", flex: 1 }}>
          {results.map((book) => (
            <li key={book.id} style={{ marginBottom: "10px" }}>
              <button
                onClick={() => fetchBookText(book.textUrl)}
                style={{ width: "100%", padding: "12px", textAlign: "left", background: "#fff", border: "1px solid #ddd", borderRadius: "4px", cursor: "pointer" }}
              >
                <div style={{ fontWeight: "bold", fontSize: "14px" }}>{book.title}</div>
                <div style={{ fontSize: "12px", color: "#666" }}>{book.author}</div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* 右メイン：朗読ビューアエリア */}
      <div style={{ flex: 1, padding: "20px", display: "flex", flexDirection: "column", background: "#fff" }}>
        
        {/* 上部コントロール（印刷ボタン ＆ ページめくりボタン） */}
        <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              style={{ padding: "8px 16px", cursor: currentPage === 0 ? "not-allowed" : "pointer", opacity: currentPage === 0 ? 0.5 : 1 }}
            >
              ◀ 前のページ
            </button>
            <span style={{ fontSize: "14px", fontWeight: "bold" }}>
              {currentPage + 1} / {pages.length} ページ
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(pages.length - 1, p + 1))}
              disabled={currentPage === pages.length - 1}
              style={{ padding: "8px 16px", cursor: currentPage === pages.length - 1 ? "not-allowed" : "pointer", opacity: currentPage === pages.length - 1 ? 0.5 : 1 }}
            >
              次のページ ▶
            </button>
          </div>

          <button
            onClick={() => window.print()}
            style={{ padding: "10px 20px", backgroundColor: "#0070f3", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
          >
            🖨️ A4縦書きで印刷
          </button>
        </div>

        {/* 本文表示エリア（縦書き・ルビ対応） */}
        <div className="reader-container" style={{ flex: 1, overflow: "hidden", border: "1px solid #ddd", borderRadius: "4px", background: "#fafafa" }}>
          <div
            className="vertical-text"
            dangerouslySetInnerHTML={{ __html: parseAozoraText(pages[currentPage] || "") }}
          />
        </div>
      </div>

      <style jsx global>{`
        /* 縦書き・朗読用スタイル */
        .vertical-text {
          writing-mode: vertical-rl;
          text-orientation: mixed;
          font-family: "Hiragino Mincho ProN", "Yu Mincho", "Shippori Mincho", serif;
          font-size: 18px;
          line-height: 2.5;
          height: 100%;
          overflow-x: auto;
          padding: 40px;
          background-color: #fff;
        }

        /* 本当の本のように行の隣に綺麗に配置されるルビの設定 */
        rt {
          font-size: 0.5em;
          color: #444;
          ruby-align: center;
        }
        
        /* 印刷用CSS（A4横向き・縦書き） */
        @media print {
          .no-print { display: none !important; }
          @page { size: A4 landscape; margin: 15mm; }
          body { background: #fff !important; }
          .reader-container { border: none !important; background: none !important; }
          .vertical-text {
            border: none;
            height: 100% !important;
            width: 100% !important;
            overflow: visible !important;
            padding: 0;
            font-size: 16pt;
            line-height: 2.4;
          }
        }
      `}</style>
    </div>
  );
}
