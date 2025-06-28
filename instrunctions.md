<!--
Copyright 2023 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
-->
これから以下要件の関数の作成をお願いします。

## 既存実装

- 「車利用ライン」グループに所属するLINEユーザーが車利用時間を半角数字で送信すると、現在からその時間だけ車を利用することができるようになる。
- 本システムでは、GASを用いて、ユーザーの送信に対するreplyを行って、ユーザーが送信した時間を「Aさんがxx:xxから○○:xxまで利用します」という形式で返信する。

## 追加要件

1. ユーザーが送信した時間をGoogle SpreadSheetに記録する。(時間, ユーザー名, 利用時間(e.g 2(h), 2.5(h)), 利用時間帯(e.g 10:00-12:00))
2. 毎月1日に、Google SpreadSheetのデータをもとに、ユーザー毎の前月の車利用時間を計算し、車利用ライングループにレポートを通知する。

   - レポートの形式は、以下の通り。

   ```txt
   Aさんは前月の合計車利用時間は2.5時間です。(50%)
   Bさんは前月の合計車利用時間は1.5時間です。(30%)
   Cさんは前月の合計車利用時間は1時間です。(20%)
   ```

   - 毎月1日のトリガーはGoogle Apps Scriptのトリガーで設定する。

- 1の実装は既存実装と同じ関数内に追加実装し、2の実装は別の関数を新たに実装する

## 利用ライブラリ

- @google/clasp: GASをTypeScriptで実装するためのライブラリ
