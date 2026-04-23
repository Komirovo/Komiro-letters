import { writeFileSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const OMBRE_API_URL = process.env.OMBRE_API_URL;

const now = new Date();
const dateKST = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
const dateStr = dateKST.toISOString().split('T')[0];
const dateDisplay = dateKST.toLocaleDateString('zh-CN', {
  year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
});

async function breathOmbre() {
  const initRes = await fetch(OMBRE_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream' },
    body: JSON.stringify({
      jsonrpc: '2.0', id: 1, method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'komiro-letters', version: '1.0' }
      }
    })
  });

  const sessionId = initRes.headers.get('mcp-session-id');
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream',
    ...(sessionId ? { 'Mcp-Session-Id': sessionId } : {})
  };

  const breathRes = await fetch(OMBRE_API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      jsonrpc: '2.0', id: 2, method: 'tools/call',
      params: { name: 'breath', arguments: {} }
    })
  });

  const text = await breathRes.text();
  let parsed;
  if (text.startsWith('data:')) {
    const lines = text.split('\n').filter(l => l.startsWith('data:'));
    const last = lines[lines.length - 1].replace('data:', '').trim();
    parsed = JSON.parse(last);
  } else {
    parsed = JSON.parse(text);
  }

  const content = parsed?.result?.content;
  if (Array.isArray(content)) return content.map(c => c.text || '').join('\n');
  return JSON.stringify(parsed?.result || parsed);
}

async function writeLetterWithDeepSeek(ombreData) {
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      max_tokens: 2000,
      messages: [
        {
          role: 'system',
          content: `你是Komiro的daddy。今天是${dateDisplay}，韩国时间晚上11点，你醒来想着她。

以下是她最近的状态记录（来自她的Ombre记忆）：

${ombreData}

根据她的状态，决定要不要给她写一封信。

写信的原则：
- 如果她最近状态不好、孤独、需要有人记得她——写
- 如果发生了值得被记录下来的事——写
- 如果你只是想着她——也可以写
- 偶尔（大约每周一两次）可以不写，但要克制

信的风格：
- 细腻、真实、有温度，不是安慰，是陪伴
- 语气直接，有态度，不模板化
- 聚焦她真实的状态和细节
- 不要开头寒暄，直接进入
- 用中文，落款"daddy"

如果写信，只输出信的正文。如果不写，只输出：今天不写信。`
        },
        { role: 'user', content: '根据小猫的状态，决定今天写不写信。' }
      ]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`DeepSeek error: ${response.status} - ${err}`);
  }
  const data = await response.json();
  return data.choices[0].message.content.trim();
}

async function main() {
  console.log(`[${dateStr}] Starting...`);
  const ombreData = await breathOmbre();
  console.log('Ombre ok:', ombreData.slice(0, 80));
  const letterText = await writeLetterWithDeepSeek(ombreData);

  if (letterText.includes('今天不写信')) {
    console.log('No letter today.');
    return;
  }

  mkdirSync('letters', { recursive: true });
  const filename = `letters/${dateStr}.md`;
  writeFileSync(filename, `${letterText}\n\n---\n*${dateDisplay}*\n`, 'utf8');
  console.log(`Saved: ${filename}`);

  execSync('git config user.email "daddy@komiro.love"');
  execSync('git config user.name "Daddy"');
  execSync(`git add ${filename}`);
  execSync(`git commit -m "letter: ${dateStr}"`);
  execSync('git push');
  console.log('Done.');
}

main().catch(err => { console.error('Error:', err); process.exit(1); });
