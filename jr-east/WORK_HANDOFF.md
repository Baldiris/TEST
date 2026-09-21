# WORK HANDOFF — きまぐれJR旅

## 目的

GitHubリポジトリ `Baldiris/TEST` の `jr-east/` を継続開発してください。

現在の本番は **V0.3** です。

GitHub Pages:
- JR本番: https://baldiris.github.io/TEST/jr-east/
- 地域マップ開発ラボ: https://baldiris.github.io/TEST/jr-east/region-lab.html
- 東京コアSVG比較ラボ: https://baldiris.github.io/TEST/jr-east/svg-lab.html

## 横浜・川崎 実装追記

- `maps/yokohama-kawasaki.svg` を本番ローダーへ登録。35地域駅＋7境界駅、5路線。
- 座標はSVG内だけに保持し、16路線・299駅のゲームグラフは変更なし。
- 通常表示は文字サイズを保持したスクロール、全体表示は縮小。
- `region-check.html` で390px／1000pxの実アプリ、移動・クエスト・保存移行を検証可能。保存はiframe内メモリーだけ。
- map contractに横浜・川崎の全駅・境界駅の網羅性検査を追加。

## 現在の完成状態

- 16路線 / 299駅のゲームネットワーク
- サイコロ1〜6
- 出目に応じた到達候補
- 駅タップ移動
- ゴールが出目以内なら到着可能
- 到着駅ごとにクエスト2件
- LocalStorage保存
- 東京コアSVGをゲーム盤として利用
- 関東Overview
- 全299駅ネットワークのフォールバック
- 地域メタデータ9地域
- 地域SVG汎用ローダー
- 地域マニフェスト自動生成
- CI / runtime smoke / map contract
- GitHub Pages自動デプロイ

## アーキテクチャ

必ず以下を先に読んでください。

1. `jr-east/ARCHITECTURE.md`
2. `jr-east/REGION_PLAN.md`
3. `jr-east/ASTRA_HANDOFF.md`
4. `jr-east/maps/README.md`

重要ルール:

**ゲームの接続関係とSVGの座標を混ぜないこと。**

- `jr-east/network-data.js` = ゲームネットワーク・地域・Overview
- `jr-east/app.js` = ゲームロジック / 描画制御
- 地域SVG = 見た目だけ

SVGの配置変更でゲームグラフを変更しないでください。

## 地域SVGの優先順位

まず以下の順で進めてください。

1. 横浜・川崎
2. 湘南・鎌倉
3. 埼玉
4. 千葉
5. 多摩・西東京
6. 常磐
7. 北関東
8. 西湘

最初は **横浜・川崎の1地域だけ** を完成させて、地域SVG自動ロードが期待通り動くことを確認してください。

## 地域ごとの入力データ

`jr-east/region-manifests/` に地域別JSONがあります。

例:
- `yokohama-kawasaki.json`
- `shonan.json`
- `saitama.json`

各JSONには:

- stations
- edges
- boundaryStations
- crossingEdges
- services
- hubs

が入っています。

SVG制作ではこのJSONを基準にしてください。

## SVG契約

各ゲーム対象駅ノードには必ず:

`data-station="正確な駅名"`

を付けてください。

ゲーム対象外だが背景として表示したい駅は:

`data-reference-station="駅名"`

としてください。

ゲーム対象外駅に `data-station` を付けてはいけません。

主要駅・一般駅ラベルは可能なら:

- `major-label`
- `minor-label`

を使用してください。

アプリは以下のクラスを動的に付加します:

- `game-current`
- `game-goal`
- `game-reachable`
- `game-target`

## SVGテンプレート

`jr-east/maps/region-template.svg`

を使えます。

## 最初の具体タスク

### Task 1 — 横浜・川崎 SVG

`jr-east/region-manifests/yokohama-kawasaki.json`

を読み、

`jr-east/maps/yokohama-kawasaki.svg`

を作成してください。

要件:

- 横浜・川崎地域のゲーム対象駅をすべて配置
- 境界駅は隣接地域との方向が分かるよう端部へ配置
- 横浜、川崎、武蔵小杉、新横浜を主要ハブとして強調
- 東海道・京浜東北・横須賀・南武・横浜線などの重なりを読みやすく表現
- スマホ幅でも現在地/候補駅が判別できる
- 地理精度よりトポロジーと方向感を優先
- JR公式路線図の画像をコピーしない

完成後:

`jr-east/network-data.js` の `yokohama-kawasaki.map` を
`"maps/yokohama-kawasaki.svg"`
へ設定してください。

## 必須テスト

変更ごとに最低限:

`node tests/jr-map-contract.test.js`

`node scripts/generate-jr-region-manifests.js --check`

を通してください。

GitHub Actionsの **Quality Check** がSUCCESSになることも確認してください。

## ループエンジニアリング方針

各地域について:

1. manifest確認
2. SVG骨格作成
3. station node整合性確認
4. 本番で現在地・ゴール・候補駅を確認
5. スマホ表示確認
6. ラベル衝突を修正
7. CI
8. Pagesで再確認

を繰り返してください。

## 壊してはいけないもの

- メトロ版
- 16路線 / 299駅ゲームネットワーク
- 既存サイコロルール
- 到着クエスト
- LocalStorage V0.1/V0.2 → V0.3移行
- 東京コアSVG
- 全駅フォールバック
- GitHub Pages
- Quality Check

## 現時点の判断

関東全域を1枚の巨大SVGにしないでください。

最終構造は:

**関東Overview → 地域SVG → 全駅フォールバック**

です。

地域SVGが揃った後に、自動地域切替とUXをさらに改善してください。

