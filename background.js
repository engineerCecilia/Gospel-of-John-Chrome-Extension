chrome.action.onClicked.addListener(() => {
  const url = chrome.runtime.getURL('reader.html');
  chrome.tabs.create({ url });
});
