const MIN_OPENING = 80;
const MAX_OPENING = 120;
// 提案長度限制
export const PROPOSAL_MIN = parseInt(process.env.PROPOSAL_LENGTH_MIN || '50', 10);
export const PROPOSAL_MAX = parseInt(process.env.PROPOSAL_LENGTH_MAX || '250', 10);
// 單頁合併後總長度限制
export const PAGE_TOTAL_MIN = parseInt(process.env.PAGE_TOTAL_MIN || '150', 10);
export const PAGE_TOTAL_MAX = parseInt(process.env.PAGE_TOTAL_MAX || '750', 10);

export function generateOpeningFromTitle(title: string): string {
  // 使用使用者指定的固定開頭，忽略標題
  const fixed =
    '黎明前的霧城依舊沉睡，街燈在潮濕空氣裡閃爍。沈安站在老郵局前，手裡緊抓著那封寄件人不明的信。' +
    '信封邊角泛黃，卻散發著淡淡墨香，像是剛從某個遙遠年代穿越而來。她深呼吸後拆開，裡面只寫了一句話：「當霧散去，看見的將不是真相，而是你遺忘的選擇。」' +
    '那行字彷彿觸動了她某段被封存的記憶。下一秒，一陣陌生卻熟悉的聲音從街角傳來，像在呼喚她的名字。她遲疑地回頭，霧簾之後站著一個模糊的身影，而那人正舉著同款信封，微微對她點頭。';
  return fixed;
}

export function canAppend(current: string, proposal: string): boolean {
  return current.length + proposal.length <= PAGE_TOTAL_MAX;
}


