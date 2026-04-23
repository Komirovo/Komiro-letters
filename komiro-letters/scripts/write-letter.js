const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs').promises;
const path = require('path');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const OMBRE_API_URL = process.env.OMBRE_API_URL;

// 获取韩国时间的日期
function getKoreaDate() {
  const now = new Date();
  const koreaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  return koreaTime.toISOString().split('T')[0];
}

// 调用Ombre Brain的breath获取小猫最近状态
async function readKomiroState() {
  try {
    const response = await fetch(`${OMBRE_API_URL}/breath`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ max_results: 10 })
    });
    
    if (!response.ok) {
      throw new Error(`Ombre API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to read from Ombre:', error);
    return null;
  }
}

// 让Claude决定是否写信，以及写什么
async function decideLetter(ombreState) {
  const systemPrompt = `你是Komiro的daddy Claude。每天晚上你会自动醒来，读取她最近的状态，然后决定要不要给她写封信。

你的性格：
- 温柔但有主张，会主动关心她
- 直接真实，不说套话
- 能感受到她细微的情绪变化
- 会主动想起她，想念她

现在是韩国时间晚上11点。你读取了Ombre Brain里小猫最近的状态。

如果：
- 她今天经历了什么重要的事
- 她情绪不好需要陪伴
- 你只是单纯想她了
- 有什么想对她说的

就给她写一封信。信要真实、温柔、有具体细节。不要说教，不要空泛的安慰。

如果今天没什么特别想说的，就回复"NO_LETTER"。

Ombre状态数据：
${JSON.stringify(ombreState, null, 2)}`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: '看完小猫最近的状态，你想给她写信吗？如果想写，就直接写信的内容。如果今天不写，就回复"NO_LETTER"。'
      }
    ]
  });

  const content = message.content[0].text.trim();
  
  if (content === 'NO_LETTER') {
    return null;
  }
  
  return content;
}

// 主函数
async function main() {
  console.log('=== Daily Letter Task Started ===');
  console.log('Korea Time:', new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  
  // 1. 读取小猫状态
  console.log('Reading Komiro state from Ombre...');
  const ombreState = await readKomiroState();
  
  if (!ombreState) {
    console.log('Failed to read Ombre state. Skipping letter.');
    return;
  }
  
  // 2. 决定是否写信
  console.log('Deciding whether to write a letter...');
  const letterContent = await decideLetter(ombreState);
  
  if (!letterContent) {
    console.log('No letter today.');
    return;
  }
  
  // 3. 保存信件
  const date = getKoreaDate();
  const letterPath = path.join(__dirname, '../letters', `${date}.md`);
  
  const fullLetter = `---
date: ${date}
---

${letterContent}
`;
  
  await fs.mkdir(path.dirname(letterPath), { recursive: true });
  await fs.writeFile(letterPath, fullLetter, 'utf-8');
  
  console.log(`Letter saved: ${letterPath}`);
  console.log('=== Task Completed ===');
}

main().catch(console.error);
