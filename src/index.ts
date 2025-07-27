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
const SPREADSHEET_ID = prop.SPREADSHEET_ID;
const GROUP_ID = prop.GROUP_ID;

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

    recordCarUsage(user_id, user_name, time);
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

function recordCarUsage(user_id: string, user_name: string, time: number) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getActiveSheet();

    const current_time = new Date();
    const end_time = new Date(current_time.getTime() + time * 3600000);

    const timeRange = `${Utilities.formatDate(current_time, 'JST', 'HH:mm')}-${Utilities.formatDate(end_time, 'JST', 'HH:mm')}`;

    const rowData = [
      Utilities.formatDate(current_time, 'JST', 'yyyy/MM/dd HH:mm:ss'),
      user_name,
      time,
      timeRange,
      user_id,
    ];

    sheet.appendRow(rowData);
  } catch (e) {
    console.error('スプレッドシートへの記録に失敗しました:', e);
  }
}

// 月次レポートを生成してLINEグループに送信する関数
// この関数は毎月1日のGASトリガーで実行される
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function sendMonthlyReport() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getActiveSheet();

    const lastMonth = getLastMonth();
    const data = getMonthlyData(sheet, lastMonth);

    if (!data.length) return;

    const userUsage = aggregateUserUsage(data);

    const totalTime = Object.values(userUsage).reduce(
      (sum, userData) => sum + userData.time,
      0
    );

    const reportMessage = generateReportMessage(
      userUsage,
      totalTime,
      lastMonth
    );

    sendLineGroupMessage(reportMessage);
  } catch (e) {
    console.error('月次レポートの送信に失敗しました:', e);
  }
}

function getLastMonth() {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return {
    year: lastMonth.getFullYear(),
    month: lastMonth.getMonth() + 1,
  };
}

function getMonthlyData(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  targetMonth: { year: number; month: number }
) {
  const data = sheet.getDataRange().getValues();
  const monthlyData = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const recordDate = new Date(row[0]);

    if (
      recordDate.getFullYear() === targetMonth.year &&
      recordDate.getMonth() + 1 === targetMonth.month
    ) {
      monthlyData.push({
        userName: row[1],
        usageTime: row[2],
        userId: row[4],
      });
    }
  }

  return monthlyData;
}

function aggregateUserUsage(
  data: Array<{ userName: string; usageTime: number; userId: string }>
) {
  const userUsage: { [key: string]: { time: number; userName: string } } = {};

  data.forEach(record => {
    if (userUsage[record.userId]) {
      userUsage[record.userId].time += record.usageTime;
      // 最新のユーザー名で更新（最後に記録されたものが最新）
      userUsage[record.userId].userName = record.userName;
    } else {
      userUsage[record.userId] = {
        time: record.usageTime,
        userName: record.userName,
      };
    }
  });

  return userUsage;
}

function generateReportMessage(
  userUsage: { [key: string]: { time: number; userName: string } },
  totalTime: number,
  lastMonth: { year: number; month: number }
) {
  let message = `📊 ${lastMonth.year}年${lastMonth.month}月の車利用レポート 📊\n\n`;
  message += `🚗 総利用時間: ${totalTime}時間\n`;
  message += `👥 利用者数: ${Object.keys(userUsage).length}名\n\n`;
  message += `📈 利用時間ランキング:\n`;

  const sortedUsers = Object.entries(userUsage).sort(
    ([, a], [, b]) => b.time - a.time
  );

  sortedUsers.forEach(([, { time, userName }], index) => {
    const percentage = totalTime > 0 ? Math.round((time / totalTime) * 100) : 0;
    const rank = index + 1;
    let rankEmoji = '';
    let usageEmoji = '';

    // ランキングに応じて絵文字を設定
    if (rank === 1) rankEmoji = '1️⃣';
    else if (rank === 2) rankEmoji = '2️⃣';
    else if (rank === 3) rankEmoji = '3️⃣';
    else rankEmoji = `${rank}️⃣`;

    // 利用時間に応じて絵文字を設定
    if (time >= 35)
      usageEmoji = '🚗'; // 35時間以上
    else if (time >= 20)
      usageEmoji = '🚙'; // 20時間以上
    else if (time >= 10)
      usageEmoji = '🚐'; // 10時間以上
    else usageEmoji = '🛵'; // 10時間未満

    message += `${rankEmoji} ${userName}さん: ${time}時間 (${percentage}%) ${usageEmoji}\n`;
  });

  message += `\n✨ 今月も安全運転でお願いします！ ✨`;

  return message;
}

function sendLineGroupMessage(message: string) {
  const url = 'https://api.line.me/v2/bot/message/push';
  const headers = {
    'Content-Type': 'application/json; charset=UTF-8',
    'Authorization': 'Bearer ' + ACCESS_TOKEN,
  };
  const postData = {
    to: GROUP_ID,
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

// スプレッドシートを初期化する関数（初回実行時のみ使用）
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function initializeSpreadsheet() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getActiveSheet();

    // ヘッダー行を設定
    const headers = [
      '記録時間',
      'ユーザー名',
      '利用時間(時間)',
      '利用時間帯',
      'ユーザーID',
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    // ヘッダー行のスタイルを設定
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.getRange(1, 1, 1, headers.length).setBackground('#f0f0f0');

    console.log('スプレッドシートの初期化が完了しました');
  } catch (e) {
    console.error('スプレッドシートの初期化に失敗しました:', e);
  }
}
