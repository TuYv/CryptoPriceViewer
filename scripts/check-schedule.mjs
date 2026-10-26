/**
 * 看大事日程（src/core/schedule.ts）里的日期还剩多少天。
 * GitHub 上每月运行一次（.github/workflows/schedule-reminder.yml），不到 90 天时开一个 issue 提醒加下一年的日期。
 * 本地运行：node scripts/check-schedule.mjs（Node.js 23.6 以上能直接读 .ts 文件）
 */
import fs from 'node:fs';
import { scheduleEndsAt } from '../src/core/schedule.ts';

const endsAt = scheduleEndsAt();
const daysLeft = Math.floor((endsAt - Date.now()) / 86_400_000);
const last = new Date(endsAt).toISOString().slice(0, 10);
console.log(`大事日程写到 ${last}，还剩 ${daysLeft} 天`);

// 在 GitHub Actions 里运行时，把结果交给后面的步骤
if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `days_left=${daysLeft}\nlast=${last}\n`);
}
