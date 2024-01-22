/**
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const prop = PropertiesService.getScriptProperties().getProperties();

const ACCESS_TOKEN = prop.ACCESS_TOKEN;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const doPost = (e: GoogleAppsScript.Events.DoPost) => {
  const event = JSON.parse(e.postData.contents).events[0];
  const user_id = event.source.userId as string; // ユーザーIDを取得
  const user_name = getUserProfile(user_id);
  const message_text = event.message.text; // メッセージテキストを取得
  const replyToken = event.replyToken; // 応答トークンの取得

  if (isValidInput(message_text)) {
    const time = Number(message_text);
    const response_message = createResponseMessage(user_name, time);
    sendLineMessage(response_message, replyToken);
  }
};

function isValidInput(input: string) {
  const number = Number(input);
  return !isNaN(number) && number >= 0.1;
}

function createResponseMessage(user_name: string, time: number) {
  const current_time = new Date();
  let unit = '時間';
  let times = 3600000;
  if (time > 12) {
    unit = '分';
    times = 60000;
  }
  const end_time = new Date(current_time.getTime() + time * times);
  const response_message = `${user_name}さんが\n${formatDate(
    current_time
  )}から\n${formatDate(end_time)}まで\n${time}${unit}利用します。`;
  return response_message;
}

function formatDate(time: Date) {
  return Utilities.formatDate(time, 'JST', 'MM月dd日HH:mm分');
}

function sendLineMessage(message: string, replyToken: string) {
  const url = 'https://api.line.me/v2/bot/message/reply';
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + ACCESS_TOKEN,
  };
  const postData = {
    replyToken: replyToken,
    messages: [
      {
        type: 'text',
        text: message,
      },
    ],
  };

  UrlFetchApp.fetch(url, {
    method: 'post',
    headers: headers,
    payload: JSON.stringify(postData),
  });
}

function getUserProfile(user_id: string) {
  try {
    const url = 'https://api.line.me/v2/bot/profile/' + user_id;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + ACCESS_TOKEN,
    };

    const response = UrlFetchApp.fetch(url, {
      method: 'get',
      headers: headers,
      muteHttpExceptions: true,
    });
    const user_profile = JSON.parse(response.getContentText());

    return user_profile.displayName; // ユーザーの表示名を返す
  } catch (e) {
    return '友達ではない名称不明';
  }
}
