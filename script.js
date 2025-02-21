document.addEventListener("DOMContentLoaded", function () {
  const languageButton = document.getElementById("language-button");
  const languageDropdown = document.getElementById("language-dropdown");
  const languageOptions = document.querySelectorAll(".language-option");
  const loader = document.createElement("div");

  loader.id = "translation-loader";
  loader.innerHTML = "Translating...";
  document.body.appendChild(loader);
  loader.style.display = "none";

  function showLoader() {
    loader.style.display = "flex";
  }

  function hideLoader() {
    loader.style.display = "none";
  }

  let savedLang = localStorage.getItem("selectedLanguage");
  if (savedLang) {
    setLanguageButton(savedLang);
    if (savedLang !== "en") {
      applyTranslation(savedLang);
    }
  }

  languageButton.addEventListener("click", function () {
    languageDropdown.classList.toggle("hidden");
    languageDropdown.style.display = languageDropdown.classList.contains(
      "hidden"
    )
      ? "none"
      : "block";
  });

  languageOptions.forEach((option) => {
    option.addEventListener("click", function () {
      let selectedLang = this.dataset.lang;
      localStorage.setItem("selectedLanguage", selectedLang);

      setLanguageButton(selectedLang);
      languageDropdown.style.display = "none";

      if (selectedLang === "en") {
        localStorage.removeItem("selectedLanguage");
        location.reload();
        return;
      }

      applyTranslation(selectedLang);
    });
  });

  function setLanguageButton(lang) {
    let selectedOption = document.querySelector(
      `.language-option[data-lang="${lang}"]`
    );
    if (selectedOption) {
      languageButton.innerHTML = selectedOption.innerHTML + " ▼";
    }
  }

  async function applyTranslation(targetLang) {
    showLoader();

    let textNodes = [];
    let walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    let textData = [];

    while (walker.nextNode()) {
      let node = walker.currentNode;
      let parent = node.parentNode;

      if (
        node.nodeValue.trim() &&
        parent.offsetParent !== null &&
        !parent.closest(".language-switcher") &&
        !parent.closest("svg") &&
        !parent.closest("i") &&
        !parent.closest("code") &&
        !parent.closest("pre")
      ) {
        let text = node.nodeValue.trim();

        if (isAddress(text)) continue;

        textNodes.push(node);
        textData.push({
          index: textNodes.length - 1,
          text: text,
          tag: parent.tagName.toLowerCase(),
        });
      }
    }

    let chunkSize = 5;
    for (let i = 0; i < textData.length; i += chunkSize) {
      let chunk = textData.slice(i, i + chunkSize);
      translateTexts(chunk, targetLang)
        .then((translations) => {
          if (translations) {
            translations.forEach(({ index, translatedText }) => {
              if (textNodes[index]) {
                textNodes[index].nodeValue =
                  translatedText || textNodes[index].nodeValue;
              }
            });
          }
        })
        .catch((error) => console.error("Translation chunk error:", error));
    }

    hideLoader();
  }

  function isAddress(text) {
    const addressPatterns = [
      /\b(?:Unit|No\.|Street|Avenue|Road|Building|Estate|District|Dist\.|City|State|ZIP|Postal|Country|INDIA|USA|UK|CANADA|LLP)\b/i,
      /\b(?:\d{3,})\b/,
      /(?:[A-Za-z]+\s)?(?:N\.H\.|Highway|Boulevard|Drive|Plaza|Tower|Complex|Mall)/i,
    ];
    return addressPatterns.some((pattern) => pattern.test(text));
  }

  async function translateTexts(textData, targetLang) {
    let apiKey = "key";
    let url = "https://api.openai.com/v1/chat/completions";

    let chunkSize = 5;
    let chunks = [];

    for (let i = 0; i < textData.length; i += chunkSize) {
      chunks.push(textData.slice(i, i + chunkSize));
    }

    let allTranslations = [];

    for (let chunk of chunks) {
      let prompt =
        `Translate the following texts to ${targetLang}.  
            - **DO NOT** translate phone numbers, email addresses, or locations.  
            - Keep spelling **100% accurate** (NO misspellings).  
            - Maintain natural meaning and structure.  
            - Preserve formatting, grammar, and professional tone.\n\n` +
        chunk
          .map((item) => `[${item.index}] <${item.tag}> ${item.text}`)
          .join("\n");

      let response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + apiKey,
        },
        body: JSON.stringify({
          model: "gpt-4-turbo",
          messages: [
            {
              role: "system",
              content:
                "You are a professional website translator. Follow the rules strictly.",
            },
            { role: "user", content: prompt },
          ],
        }),
      });

      let data = await response.json();

      if (data.choices && data.choices[0]) {
        let translatedTexts = data.choices[0].message.content.split("\n");

        translatedTexts.forEach((translatedText) => {
          let match = translatedText.match(/^\[(\d+)]/);
          let index = match ? parseInt(match[1]) : null;

          if (index !== null) {
            allTranslations.push({
              index: index,
              translatedText: translatedText.replace(/^\[\d+\]\s*<.*?>\s*/, ""),
            });
          }
        });
      } else {
        console.error("Translation error:", data);
      }
    }

    return allTranslations;
  }

  document.addEventListener("click", function (event) {
    if (
      !languageButton.contains(event.target) &&
      !languageDropdown.contains(event.target)
    ) {
      languageDropdown.style.display = "none";
    }
  });
});
