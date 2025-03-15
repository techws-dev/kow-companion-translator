chrome.storage.local.get(["KoWCompanionTranslatorDevMode"]).then((result) => {
    if (result.KoWCompanionTranslatorDevMode === '1') {
        document.getElementById('devMode').checked = true;
    }
});

chrome.storage.local.get(["KoWCompanionTranslatorLanguage"]).then((result) => {
    if (result.KoWCompanionTranslatorLanguage === 'fr') {
        document.getElementById('translationFrench').checked = true;
    } else {
        document.getElementById('noTranslation').checked = true;
    }
});

document.getElementById('updateButton').addEventListener('click', (event) => {
    if (document.getElementById('devMode').checked) {
        chrome.storage.local.set({'KoWCompanionTranslatorDevMode': '1'});
    } else {
        chrome.storage.local.set({'KoWCompanionTranslatorDevMode': '0'});
    }
    
    chrome.storage.local.set({'KoWCompanionTranslatorLanguage': document.querySelector('input[name="language"]:checked').value});
});