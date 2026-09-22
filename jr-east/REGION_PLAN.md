# Regional Maps — PDF coverage

現在は `network-data.js` の18地域すべてにSVGがある。
従来の9地域・299駅の実装順は、ユーザーのPDF全駅対応指示で拡張した。

詳細は `WORK_HANDOFF.md` と `maps/layout-report.json` を参照。

生成は次の順番:

```sh
node scripts/generate-jr-region-manifests.js
node scripts/generate-jr-maps.js
```

`maps/layout-data.json` の座標だけを変更して地図を調整する。
駅を追加・削除する場合はネットワークとPDF駅一覧の検品を先に行う。
境界駅を含めてラベル・路線交差・候補駅状態を確認し、必要に応じて修正する。
