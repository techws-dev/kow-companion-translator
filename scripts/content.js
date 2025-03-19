

(async function() {
    var db = new Dexie('KoWCompanionTranslator');

    db.version(1).stores({
        texts: `
          value_en,
          value_translated,
          locale,
          *urls`,
    });

    let countRecords = await db.texts.count();

    if (countRecords == 0) {
        // Load json file
        var jsonFile = await fetch(chrome.runtime.getURL('data/KoWCompanionTranslator_exported_data.json'))
            .then(function(response) { return response.json(); })
            .then(function(json) { return json; });
        
        for (let text of jsonFile.texts) {
            db.texts.put(text);
        }
    }

    var currentLanguage = await chrome.storage.local.get(["KoWCompanionTranslatorLanguage"]).then(result => result.KoWCompanionTranslatorLanguage) || null;
    var devMode = await chrome.storage.local.get(["KoWCompanionTranslatorDevMode"]).then(result => result.KoWCompanionTranslatorDevMode) || null;
    var url = location.href.replace(location.hash,'');

    if (currentLanguage !== 'fr') {
        return;
    }

    let pageContentCollection = document.getElementsByClassName('rules_container');

    let pageContent = null;

    if (pageContentCollection.length === 1) {
        pageContent = pageContentCollection.item(0);
    }

    let translatableElements = pageContent
        .querySelector('.units-row, .rules_contents')
        .querySelectorAll('li, em, strong, b, i, a, p, h1, h2, h3, h4, h5, h6, span, th, td');
    
    let translations = await db.texts
        .where('locale')
        .equals('fr')
        .and(function(text) { return text.urls.includes(url); })
        .toArray();

    console.log(translations);

    for (let element of translatableElements) {
        if (element.children.length === 0 && element.innerText.trim() !== '') {
            let valueToTranslate = element.innerText.trim();
            let item = translations.find(text => text.value_en === valueToTranslate);
            
            await handleDevMode(devMode, url, element, item, valueToTranslate);
            if (item !== undefined && item.value_translated !== null) {
                element.innerHTML = element.innerHTML.replace(valueToTranslate, item.value_translated);
            }
        } else if (element.children.length > 0) {
            let child = element.firstChild
            while (child) {
                if (child.nodeType === 3 && child.data.trim() !== '') {
                    let valueToTranslate = child.data.trim();
                    let item = translations.find(text => text.value_en === valueToTranslate);
                    
                    await handleDevMode(devMode, url, element, item, valueToTranslate);
                    if (item !== undefined && item.value_translated !== null) {
                        child.data = child.data.replace(valueToTranslate, item.value_translated);
                    }
                }
                child = child.nextSibling
            }
        }
    }
})();

// ------------------------ //
// -- DEV MODE FUNCTIONS -- //
// ------------------------ //

async function handleDevMode(devMode, url, element, item, value) {
    if (devMode === '1') {
        if (item === undefined) {
            // check if exists with different url
            let item = await db.texts
                .where({locale: 'fr', value_en: value})
                .first();
            
            if (item === undefined) {
                insertNewText(value, url);
            } else if(!item.urls.includes(url)) {
                await db.texts.update(item.value_en, {
                    'urls': [...new Set(item.urls.concat([url]))]
                });
            }
        }
        if (item === undefined || item.value_translated === null) {
            setElementTranslatable(element, value);
        }
    }
}

function insertNewText(value, url) {
    db.texts.put({
        'value_en': value,
        'value_translated': null,
        'locale': 'fr',
        'urls': [url]
    });
}

function setElementTranslatable(element, value) {
    element.style.border = '1px red solid';

    element.addEventListener('click', event => {
        event.preventDefault();
        translation = window.prompt(value);

        if (translation && translation.trim() !== '') {
            translation = translation.trim();
            db.texts.update(value, {
                'value_translated': translation
            }).then(() => {
                location.reload(true);
            });
        }
    });
}
