# きまぐれJR旅 — 参照デザイン版

公開先: https://baldiris.github.io/TEST/jr-east/design-reference.html

参考画像に合わせた淡い空色、緑のボタン、東京の風景、スマートフォン風のトップ画面。ゲーム画面も同じ色・余白・カードで統一。

- トップ → 出発駅・ゴール抽選 → サイコロ → 候補選択 → 到着 → クエスト → 次のターン → 完走まで操作可能。
- 「横浜から旅を試す」は横浜 → 東京の実際のゲームを開始する。
- 539駅・34サービス・18地域図は既存データを使用。
- 本番の index.html / app.js / style.css / network-data.js は変更しない。
- design-engine.js は app.js から生成。変更点は保存キーと旧版移行キーの無効化のみ。
- プレビュー保存: kimagureJRDesignReferenceV03。本番V0.1〜V0.3の保存を読まず、書き換えない。
- design-reference.js は画面切替・導線・クエストボタンの読み上げ名を追加する表示用アダプター。
- 訪れた駅とクエストは旅の履歴として記録。参考画像の未実装機能を実装済みとして案内しない。

## 生成・確認

    node scripts/generate-jr-design-engine.js
    node tests/jr-design-reference.test.js

CIでエンジン一致・全操作ID・素材・スクリプト順序・保存分離を確認する。
design-reference-check.html で390px/1000pxの表示と一連のゲーム操作を検証する。検証ページの保存はメモリー内のみ。

## 背景画像

assets/kanto-riverside.webp: built-in image_genで生成し、ユーザーの選択範囲削除を反映。WebPへ形式変換して同梱。
写真風のイメージで、実在する鉄道路線の地理資料ではない。

初回プロンプト要旨: 明るい東京の空、スカイツリー、川沿いの緑、銀色と緑の通勤電車。左側に文字用の余白。文字・ロゴ・UIなし。
編集プロンプト: 選択範囲の内容を削除し、周囲の風景と自然につなぐ。範囲外の構図・光・色・写真のスタイルを維持。結果は電車・線路のない川沿いの風景。
