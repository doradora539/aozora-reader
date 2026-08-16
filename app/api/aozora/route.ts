import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json(
      { error: 'URLが指定されていません' },
      { status: 400 }
    );
  }

  try {
    // .html のURLが指定されても、確実にテキストが取得できる .txt に自動変換する
    const txtUrl = targetUrl.replace(/\.html$/, '.txt');

    const res = await fetch(txtUrl);
    if (!res.ok) throw new Error('青空文庫からのデータ取得に失敗しました');

    const arrayBuffer = await res.arrayBuffer();
    const decoder = new TextDecoder('shift_jis');
    let text = decoder.decode(arrayBuffer);

    // 青空文庫の冒頭にある「底本情報」などのヘッダー部分を切り落として本文だけにする
    const headerSplit = text.split(
      '--------------------------------------------------\n'
    );
    if (headerSplit.length >= 3) {
      text = headerSplit
        .slice(2)
        .join('--------------------------------------------------\n');
    }

    return NextResponse.json({ text });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'サーバー処理中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
