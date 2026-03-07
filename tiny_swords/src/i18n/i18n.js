const translations = {
    en: {
        loading: 'Loading...',
        loadingPct: 'Loading... {pct}%',
        startGame: 'Start Game',
        quit: 'Quit',
        waveCount: 'Wave {wave}',
        nextWave: 'Next wave: {sec}s',
        waveIncoming: 'Wave incoming!',
        victory: 'VICTORY',
        victoryHud: 'VICTORY!',
        defeat: 'DEFEAT',
        defeatHud: 'DEFEATED',
        playAgain: 'Play Again',
        mainMenu: 'Main Menu',
        goldMine: 'Gold Mine',
        house: 'House',
        barracks: 'Barracks',
        archery: 'Archery',
        tower: 'Tower',
        monastery: 'Monastery',
        train: 'Train ({cost}g)',
        goldIncome: '+{amount}g',
        healAmount: '+{amount}',
    },
    zh: {
        loading: '載入中...',
        loadingPct: '載入中... {pct}%',
        startGame: '開始遊戲',
        quit: '離開',
        waveCount: '第 {wave} 波',
        nextWave: '下一波：{sec}秒',
        waveIncoming: '敵波來襲！',
        victory: '勝利',
        victoryHud: '勝利！',
        defeat: '戰敗',
        defeatHud: '戰敗',
        playAgain: '再玩一次',
        mainMenu: '主畫面',
        goldMine: '金礦',
        house: '房屋',
        barracks: '兵營',
        archery: '射箭場',
        tower: '箭塔',
        monastery: '修道院',
        train: '訓練 ({cost}g)',
        goldIncome: '+{amount}g',
        healAmount: '+{amount}',
    }
};

let currentLocale = localStorage.getItem('locale') || 'en';

export function t(key, params = {}) {
    const dict = translations[currentLocale] || translations.en;
    let str = dict[key] || translations.en[key] || key;
    for (const [k, v] of Object.entries(params)) {
        str = str.replace(`{${k}}`, v);
    }
    return str;
}

export function getLocale() {
    return currentLocale;
}

export function setLocale(locale) {
    currentLocale = locale;
    localStorage.setItem('locale', locale);
}
