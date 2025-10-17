# Territory Cleaner (Web MVP)

掃除という日常のタスクをAR（拡張現実）で可視化し、ゲーミフィケーションするWebアプリケーションのMVP（実用最小限の製品）。

## プロジェクト概要

ユーザーはアプリのインストール不要で、スマートフォンのブラウザからURLにアクセスするだけで、掃除した場所がリアルタイムで色付けされていく体験ができます。

## 技術スタック

- **フレームワーク**: Next.js 15 (App Router, React)
- **AR機能**: WebXR Device API
- **3D/ARフレームワーク**: A-Frame
- **3D描画エンジン**: Three.js
- **物体追跡**: OpenCV.js
- **スタイリング**: Tailwind CSS

## 要件定義

### コア機能

1. **ARセッションの開始**
   - ページにアクセスすると、STARTボタンでカメラ使用の許可を求める
   - ユーザーが許可すると、カメラ映像が表示されAR体験が開始される

2. **平面の認識**
   - ARが起動したら、床や机などの水平な平面を自動で認識
   - WebXR Hit Testによりレティクル（緑の円）で床面の推定位置を可視化

3. **掃除ツールのマーカー追跡**
   - カメラ映像の中から、あらかじめ指定した特定の色の物体（マーカー）をリアルタイムで追跡
   - MVPでは、掃除機やモップの先端に貼り付けた蛍光ピンクのテープをマーカーとして使用
   - OpenCV.jsによるHSV色空間変換→色域マスク→輪郭抽出→最大輪郭の中心取得

4. **軌跡の描画**
   - マーカーが移動した軌跡に沿って、認識した平面（床）の上に半透明の青い色を描画
   - Canvas Textureを床面Planeに適用

5. **UI**
   - **START / STOP ボタン**: 軌跡の描画を開始・一時停止
   - **RESET ボタン**: 描画した色をすべてリセット
   - **掃除道具選択**: 蛍光ピンク・緑などの色域プリセット切替
   - **掃除した面積 (%) 表示**: 認識した平面全体に対する、描画された面積の割合をパーセンテージで表示

## ディレクトリ構成

```
territory-cleaner-web/
├── src/
│   ├── app/
│   │   ├── layout.tsx        # Next.js App Routerレイアウト
│   │   └── page.tsx           # メインページ（ARView統合、状態管理）
│   ├── components/
│   │   ├── ARView.js          # A-FrameベースのARシーン
│   │   ├── aframe-hit-test.js # WebXR Hit Testカスタムコンポーネント
│   │   ├── aframe-paint-canvas.js # 床面描画カスタムコンポーネント
│   │   ├── ControlsOverlay.tsx    # START/STOP/RESETボタンUI
│   │   ├── ToolSelector.tsx       # 掃除道具（色プリセット）選択UI
│   │   └── XRSupportBanner.tsx    # WebXR未対応時の案内バナー
│   └── lib/
│       ├── loadOpenCV.js      # OpenCV.js動的読み込み
│       └── markerTracker.js   # マーカー色検出ロジック（HSV→輪郭抽出）
├── public/
├── package.json
└── README.md
```

## セットアップ・起動

### 依存関係のインストール

```bash
cd territory-cleaner-web
npm install
```

### 開発サーバーの起動

```bash
npm run dev
```

デフォルトでは `http://localhost:3000` で起動します。

### 本番ビルド

```bash
npm run build
npm start
```

## 使い方

1. **WebXR対応モバイルブラウザでアクセス**
   - Android: Chrome、Edge など
   - iOS: WebXR Viewerなど（標準Safariは未対応の場合あり）
   - **HTTPS環境必須**（ローカル開発の場合は `localhost` で許可される）

2. **掃除道具の選択**
   - 画面上部で蛍光ピンクや緑などの色プリセットを選択
   - 実際の掃除道具（掃除機・モップ）の先端に選択した色のテープを貼り付ける

3. **STARTボタンを押下**
   - カメラ許可を求められるので許可
   - ARセッションが開始され、床面にレティクル（緑の円）が表示される

4. **掃除開始**
   - 選択した色のマーカーをカメラに映しながら床を動かす
   - マーカーの軌跡に沿って床面が青く塗られ、画面左上に掃除面積(%)が表示される

5. **STOP / RESET**
   - **STOP**: 追跡を一時停止
   - **RESET**: 描画をすべてクリア

## 注意事項

- WebXR対応ブラウザとHTTPS（またはlocalhostの開発例外）が必須です。
- デスクトップ環境では動作しません。モバイル実機でお試しください。
- OpenCV.jsはCDNから動的読み込みするため、初回は読み込みに数秒かかる場合があります。
- カメラフレームへのアクセスはWebXRセッション中の制限があるため、実機では別途`getUserMedia`で取得したvideoストリームを使用する必要があります（現在は簡易実装）。

## 今後の拡張案

- カメラフレームの取得を`getUserMedia`で実装し、実機でのマーカー追跡を完全動作
- 掃除エリアのヒートマップ表示
- 複数ユーザーでのスコア競争機能
- 掃除履歴の保存・共有

## ライセンス

MIT License

## 作成者

Territory Cleaner Development Team
