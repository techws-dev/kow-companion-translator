
var db = new Dexie('KoWCompanionTranslator');

db.version(1).stores({
    texts: `
      value_en,
      value_translated,
      locale`,
});

(async function() {
    var currentLanguage = await chrome.storage.local.get(["KoWCompanionTranslatorLanguage"]).then(result => result.KoWCompanionTranslatorLanguage) || null;
    var devMode = await chrome.storage.local.get(["KoWCompanionTranslatorDevMode"]).then(result => result.KoWCompanionTranslatorDevMode) || null;

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
        
    let translations = await db.texts.where({'locale': 'fr'}).toArray();

    for (let element of translatableElements) {
        if (element.children.length === 0 && element.innerText.trim() !== '') {
            let item = translations.find(text => text.value_en === element.innerText.trim());
            
            if (devMode === '1' && item === undefined) {
                insertNewText(element.innerText.trim());
            } else if (item.value_translated !== null) {
                element.innerHTML = element.innerHTML.replace(element.innerText.trim(), item.value_translated);
            }
            if (devMode === '1' && (item === undefined || item.value_translated === null)) {
                setElementTranslatable(element, element.innerText.trim());
            }

        } else if (element.children.length > 0) {
            let child = element.firstChild
            while (child) {
                if (child.nodeType === 3 && child.data.trim() !== '') {
                    let item = translations.find(text => text.value_en === child.data.trim());

                    if (devMode === '1' && item === undefined) {
                        insertNewText(child.data.trim());
                    } else if (item.value_translated !== null) {
                        child.data = child.data.replace(child.data.trim(), item.value_translated);
                    }
                    if (devMode === '1' && (item === undefined || item.value_translated === null)) {
                        setElementTranslatable(element, child.data.trim());
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

function insertNewText(value) {
    db.texts.put({
        'value_en': value,
        'value_translated': null,
        'locale': 'fr'
    });
}

function setElementTranslatable(element, value) {
    element.style.border = '1px red solid';

    element.addEventListener('click', event => {
        event.preventDefault();
        translation = window.prompt(value);

        if (translation && translation.trim() !== '') {
            translation = translation.trim();
            db.texts.put({
                'value_en': value,
                'value_translated': translation,
                'locale': 'fr'
            }).then(() => {
                location.reload(true);
            });
        }
    });
}
