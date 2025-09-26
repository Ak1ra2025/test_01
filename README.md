# TODOアプリ

ブラウザのみで動作するシンプルなTODOアプリです。保存はブラウザの`localStorage`に行われます。オフラインでも動作します。

## 機能
- タスクの追加/編集/削除
- 完了/未完了の切り替え（一括操作も可）
- フィルター（すべて/未完了/完了）
- 検索（タイトル・メモの部分一致）
- 並び替え（作成日/更新日/完了状態/タイトル）
- ダークモード切替（OS設定に追従 + 手動切替）
- 永続化（localStorage）

## 使い方
1. `index.html` をブラウザで開くだけで利用できます。
2. 追加: 入力欄にタイトルを入力してEnter、または追加ボタン。
3. 編集: 「編集」ボタンでタイトル/メモを編集、Enterまたは保存で確定、Escでキャンセル。
4. 削除: 「削除」ボタンをクリック。
5. 完了: チェックボックスを切り替え。
6. フィルター/検索/並び替えは上部バーから操作可能。

## 開発
ローカルサーバで開くと便利です。

```bash
# 任意の簡易サーバ例（Python）
python3 -m http.server -d . 5173
# or
npx serve .
```

## ファイル構成
```
/ (プロジェクトルート)
├─ index.html
├─ styles.css
├─ app.js
└─ README.md
```

## ライセンス
MIT

## GitHub Pages で公開する
このリポジトリは GitHub Pages へ自動デプロイできる設定を含みます。

### 手順
1. リポジトリを GitHub に作成し、このプロジェクトを push。
2. GitHub のリポジトリ設定で Pages を有効化:
   - Settings → Pages → Build and deployment
   - Source: GitHub Actions を選択
3. `main` ブランチに push すると、Actions が動き自動で公開されます。
4. 公開URLは Actions 実行ログ、または Settings → Pages に表示されます。

メモ:
- ルート直下に `.nojekyll` を配置しているため、`_` から始まるパスもそのまま配信されます。
- 静的サイトのためビルド工程は不要です。ビルドが必要な場合は `.github/workflows/pages.yml` の build ジョブに追加してください。