import fs from "fs";
import path from "path";
import { PuppeteerScreenRecorder } from "puppeteer-screen-recorder";
import {
  checkKeysAvailability,
  convertTimeFrame,
  getSelectors,
  saveCookies,
  timeFramesSelectors,
} from "./functions.js";
import { ensureDirectoryExists } from "./functions.js";
import { getNextFileNumber } from "./functions.js";
import { getIndianDate } from "./functions.js";
import { delay } from "./functions.js";



//////////////////////////////////////////////
//////////////////////////////////////////////
/// Login Function
/////////////////////////////////////////////
/////////////////////////////////////////////
export async function login(
  browser,
  page,
  cookieFilePath,
  firstAvailableElement,
  jsonData
) {
  if (firstAvailableElement === "Not LoggedIn") {
    const loginBtn = await page.waitForSelector(
      "#tv-content > div > div > div > div > div > div.text-yrIMi47q.text_large-yrIMi47q > div > p:nth-child(1) > button"
    );

    await page.evaluate((element) => element.click(), loginBtn);

    const googleLoginSelector = await page.waitForSelector(
      "div > div.nsm7Bb-HzV7m-LgbsSe-bN97Pc-sM5MNb > span.nsm7Bb-HzV7m-LgbsSe-BPrWId"
    );

    await page.evaluate((element) => element.click(), googleLoginSelector);

    const newPagePromise = new Promise((resolve) => {
      browser.on("targetcreated", async (target) => {
        if (target.url().includes("https://accounts.google.com")) {
          const newPage = await target.page();
          resolve(newPage);
        }
      });
    });

    const googlePopupPage = await newPagePromise;
    if (!googlePopupPage) {
      throw new Error("Failed to capture the Google login popup page");
    }

    // await new Promise(resolve => setTimeout(resolve, 25000))

    // Switch to the new page
    await googlePopupPage.waitForSelector("#identifierId"); // Wait for the email input field to load
    // Xb9hP

    // Interact with the Google login form
    await googlePopupPage.type("#identifierId", jsonData.accountEmail, {
      delay: 100,
    });

    await googlePopupPage.click("#identifierNext > div > button > span"); // Click "Next" button

    await delay(4000);

    await googlePopupPage.waitForSelector(
      "#password > div.aCsJod.oJeWuf > div > div.Xb9hP > input",
      { visible: true }
    ); // Wait for the email input field to load

    await googlePopupPage.type(
      "#password > div.aCsJod.oJeWuf > div > div.Xb9hP > input",
      jsonData.accountPassword,
      {
        delay: 100,
      }
    );

    await googlePopupPage.click("#passwordNext > div > button > span"); // Click "Next" button

    const verficationText = 'div[role="presentation"] h2 > span';

    const LoggedInCheck =
      "body > div.layout__area--right > div > div.widgetbar-pages > div.widgetbar-pagescontent > div.widgetbar-page.active > div.widget-X9EuSe_t.widgetbar-widget.widgetbar-widget-watchlist > div.widgetbar-widgetbody > div > div > div > div.content-g71rrBCn > div > div > div.listContainer-MgF6KBas > div > div:nth-child(2) > div > div > div.firstItem-RsFlttSS.symbolName-RsFlttSS > span > div > div > span.inner-RsFlttSS.symbolNameText-RsFlttSS";

    const TwoFactorAuth = "#headingText > span";

    await delay(3000);
    const verificationChecking = await Promise.race([
      googlePopupPage
        .waitForSelector(TwoFactorAuth, { timeout: 60000 })
        .then(() => "Two factor Auth"),
      googlePopupPage
        .waitForSelector(verficationText, {
          timeout: 60000,
        })
        .then(() => "Verfication Needed"),
      page
        .waitForSelector(LoggedInCheck, { timeout: 60000 })
        .then(() => "LoggedIn"),
    ]);

    // console.log("Logged in status:", verificationChecking);

    if (
      verificationChecking == "Verfication Needed" ||
      verificationChecking == "Two factor Auth"
    ) {
      // console.log("verification Needed");
      await delay(jsonData.loginWait);
      await saveCookies(page, cookieFilePath);

      // Refresh the page
      await page.reload({
        timeout: 180000,
        waitUntil: ["load", "domcontentloaded"],
      });
    } else {
      // console.log("Successfully loggedIn");
      await delay(7000);
      // Save the cookies after login
      await saveCookies(page, cookieFilePath);

      // Refresh the page
      await page.reload({
        timeout: 180000,
        waitUntil: ["load", "domcontentloaded"],
      });
    }
  }
}

//////////////////////////////////////////////
//////////////////////////////////////////////
/// Recording Function
/////////////////////////////////////////////
/////////////////////////////////////////////

export async function RecordingFunction(
  page,
  jsonData,
  recorder,
  listNotFound,
  POLL_INTERVAL,
  TIMEOUT
) {
  ensureDirectoryExists(jsonData.RecordingsOutputFolder);
  // // Set up the screen recorder
  // const currentDate = getIndianDate()
  // recorder = new PuppeteerScreenRecorder(page);
  // // Start the recording, specify the output file
  // await recorder.start(`${jsonData.RecordingsOutputFolder}/${process.argv[2] ? process.argv[2] : jsonData.defaultList}-${currentDate}-${process.argv[3] ? process.argv[3] : jsonData.recordingTimeFrame}.mp4`);

  const currentDate = getIndianDate();
  const baseName = `${
    process.argv[2] ? process.argv[2] : jsonData.defaultList
  }-${currentDate}-${
    process.argv[3] ? process.argv[3] : jsonData.recordingTimeFrame
  }`;
  const extension = ".mp4";

  // Get the next available file number
  const fileName = await getNextFileNumber(
    jsonData.RecordingsOutputFolder,
    baseName,
    extension
  );

  // Set up the screen recorder
  recorder = new PuppeteerScreenRecorder(page);

  // Start the recording with the unique file name
  await recorder.start(path.join(jsonData.RecordingsOutputFolder, fileName));
  let result;
  let timeFrameArray;
  await delay(1000);

  const listNameSelector = await page.waitForSelector(
    "body > div.js-rootresizer__contents.layout-with-border-radius > div.layout__area--right > div > div.widgetbar-pages > div.widgetbar-pagescontent > div.widgetbar-page.active > div.widget-X9EuSe_t.widgetbar-widget.widgetbar-widget-watchlist > div.widgetHeader-X9EuSe_t > div > div > div.leftSlot-u7Ufi_N7.widgetbarWidgetHeaderLeftSlot-mQBvegEO > div > div > span.titleRow-mQBvegEO"
  );

  const listName = await page.evaluate(
    (listBtn) => listBtn.textContent,
    listNameSelector
  );

  // console.log("i am list name", listName);

  if (
    (listName == jsonData.defaultList && !process.argv[2]) ||
    listName == process.argv[2]
  ) {
    // console.log("deafult list is already selected");
  } else {
    const favListBtn = await page.$(
      "body > div.js-rootresizer__contents.layout-with-border-radius > div.layout__area--right > div > div.widgetbar-pages > div.widgetbar-pagescontent > div.widgetbar-page.active > div.widget-X9EuSe_t.widgetbar-widget.widgetbar-widget-watchlist > div.widgetHeader-X9EuSe_t > div > div > div.leftSlot-u7Ufi_N7.widgetbarWidgetHeaderLeftSlot-mQBvegEO > div > div > span.titleRow-mQBvegEO"
    ); // Wait for the email input field to load

    await page.evaluate((listBtn) => listBtn.click(), favListBtn);

    // const favList = await page.$$('.listContainer-XuENC387 > div > div ')

    await delay(7000);

    const favList = await page.$$(
      "#overlap-manager-root > div:nth-child(2) > div > div.dialog-qyCw0PaN.dialog-b8SxMnzX.dialog-XuENC387.dialog-aRAWUDhF.rounded-aRAWUDhF.shadowed-aRAWUDhF > div > div.wrapper-nGEmjtaX > div.dialogContent-XuENC387 > div > div > div > div > div"
    );

    // console.log("i am total list : ", favList.length);

    // Define the title you want to match
    const targetTitle = process.argv[2];
    const defaultList = jsonData.defaultList;
    // Initialize a flag to check if the title was found
    let titleFound = false;

    for (const fav of favList) {
      const title = await fav.evaluate((el) => {
        // Find the child element with a class name that starts with "title"
        const titleElement = el.querySelector('[class^="title"]');
        return titleElement
          ? titleElement.textContent.trim()
          : "Title not found";
      });

      // console.log("Title: ", title);

      if (title === targetTitle) {
        // console.log(`Found matching title: ${title}, clicking it.`);
        // Click on the title element
        await fav.evaluate((el) => {
          const titleElement = el.querySelector('[class^="title"]');
          if (titleElement) {
            titleElement.click();
          }
        });
        titleFound = true; // Mark that the title was found
        break; // Stop the loop once the title is found and clicked
      }
    }

    // If `process.argv[2]` is not provided, handle that scenario
    if (!process.argv[2]) {
      // console.log("No title provided, clicking default list item.");
      for (const fav of favList) {
        const title = await fav.evaluate((el) => {
          // Find the child element with a class name that starts with "title"
          const titleElement = el.querySelector('[class^="title"]');
          return titleElement
            ? titleElement.textContent.trim()
            : "Title not found";
        });

        // console.log("Title: ", title);

        if (title === defaultList) {
          // console.log(`Found matching title: ${title}, clicking it.`);
          // Click on the title element
          await fav.evaluate((el) => {
            const titleElement = el.querySelector('[class^="title"]');
            if (titleElement) {
              titleElement.click();
            }
          });
          titleFound = true; // Mark that the title was found
          break; // Stop the loop once the title is found and clicked
        }
      }
      // console.log("Clicked default list item.");
    }

    if (!titleFound) {
      listNotFound = true;
      // If no matching title was found after checking all items
      await page.evaluate(
        (title) => {
          alert(`No list found with the given name "${title}"`);
        },
        targetTitle ? targetTitle : defaultList
      );
      // console.log("No matching title found.");
    }
  }
  timeFrameArray = getSelectors(
    process.argv[3] ? process.argv[3] : jsonData.recordingTimeFrame
  );
  // Example usage:
  result = checkKeysAvailability(
    process.argv[3] ? process.argv[3] : jsonData.recordingTimeFrame
  );

  // console.log("i am selected time frame, and i am given time frmae");

  // console.log("i am result outside", result);

  await delay(3000);
  const totalCompanies = await page.$$(
    "body > div.js-rootresizer__contents.layout-with-border-radius > div.layout__area--right > div > div.widgetbar-pages > div.widgetbar-pagescontent > div.widgetbar-page.active > div.widget-X9EuSe_t.widgetbar-widget.widgetbar-widget-watchlist > div.widgetbar-widgetbody > div > div > div > div.content-g71rrBCn > div > div > div.listContainer-MgF6KBas > div > div"
  ); // Wait for the email input field to load

  // console.log("I am total companies stock", totalCompanies.length);

  for (let i = 1; i < totalCompanies.length; i++) {
    if (result?.length > 0) {
      // If no matching title was found after checking all items
      await page.evaluate((timeFrame) => {
        const formattedResult = timeFrame.join(", ");
        alert(
          `Wrong timefrmae is mentioned in the config file "${formattedResult}"`
        );
      }, result);
      break;
    }

    if (listNotFound) {
      // console.log("List not found");
      break;
    }
    if (i == totalCompanies.length - 1) {
      // console.log("i am last company");
      continue;
    }
    // console.log("I am inside the companies loop");
    if (i > 1) {
      // console.log("I am inside the companies loop if condition");
      await new Promise((resolve) =>
        setTimeout(resolve, jsonData.recordingIntervalDelay)
      );
    }
    const stockComany = await page.waitForSelector(
      `body > div.js-rootresizer__contents.layout-with-border-radius > div.layout__area--right > div > div.widgetbar-pages > div.widgetbar-pagescontent > div.widgetbar-page.active > div.widget-X9EuSe_t.widgetbar-widget.widgetbar-widget-watchlist > div.widgetbar-widgetbody > div > div > div > div.content-g71rrBCn > div > div > div.listContainer-MgF6KBas > div div:nth-child(${
        i + 1 == totalCompanies.length ? i : i + 1
      })  > div > div > span.cell-RsFlttSS.last-RsFlttSS`
    );
    // await page.evaluate(element => element.click(), stockComany)
    await page.click(
      `body > div.js-rootresizer__contents.layout-with-border-radius > div.layout__area--right > div > div.widgetbar-pages > div.widgetbar-pagescontent > div.widgetbar-page.active > div.widget-X9EuSe_t.widgetbar-widget.widgetbar-widget-watchlist > div.widgetbar-widgetbody > div > div > div > div.content-g71rrBCn > div > div > div.listContainer-MgF6KBas > div div:nth-child(${
        i + 1 == totalCompanies.length ? i : i + 1
      })  > div > div > span.cell-RsFlttSS.last-RsFlttSS`,
      { clickCount: 2 }
    );

    await delay(2000);
    const stockPriceSelector =
      "body > div.js-rootresizer__contents.layout-with-border-radius > div.layout__area--right > div > div.widgetbar-pages > div.widgetbar-pagescontent > div.widgetbar-page.active > div.widget-X9EuSe_t.widgetbar-widget.widgetbar-widget-detail > div.widgetbar-widgetbody > div > div.wrapper-Tv7LSjUz > div.container-qWcO4bp9.widgetWrapper-BSF4XTsE.userSelectText-BSF4XTsE.offsetDisabled-BSF4XTsE > span.priceWrapper-qWcO4bp9 > span.highlight-maJ2WnzA.price-qWcO4bp9";
    const startTime = Date.now();

    while (Date.now() - startTime < TIMEOUT) {
      const element = await page.$(stockPriceSelector);

      if (element) {
        const textContent = await page.evaluate(
          (el) => el.textContent.trim(),
          element
        );

        // Check if textContent is a number
        if (!isNaN(parseFloat(textContent))) {
          // console.log(`Number found: ${textContent}`);
          break; // Exit loop if a number is found
        } else {
          // console.log(`Not a number: ${textContent}`);
        }
      } else {
        // console.log("Element not found");
      }

      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL)); // Wait before the next check
    }
    for (let time = 0; time < timeFrameArray.length; time++) {
      const timeSelector = await page.waitForSelector(
        "#header-toolbar-intervals > button > div > div"
      );

      const currenTime = await page.evaluate(
        (time) => time.innerHTML.trim(),
        timeSelector
      );

      // console.log("I am time frmae", currenTime);

      if (
        currenTime ==
          (process.argv[3]
            ? convertTimeFrame(process.argv[3])
            : convertTimeFrame(jsonData.recordingTimeFrame)) &&
        time == 0
      ) {
        // console.log("the time is same ");
        continue;
      }
      if (time > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, jsonData.waitingTime)
        );
      } else {
        await delay(2000);
      }
      const timeFrameBtn = await page.waitForSelector(
        "#header-toolbar-intervals > button > div > div"
      ); // Wait for the email input field to load
      await page.evaluate((element) => element.click(), timeFrameBtn);

      const timeFrame = await page.waitForSelector(timeFrameArray[time]);
      // const elementHTML = await page.evaluate(el => el.innerHTML, timeFrame)
      await delay(1000);

      await page.evaluate((element) => element.click(), timeFrame);
    }
  }
  await recorder.stop();
}




//////////////////////////////////////////////
//////////////////////////////////////////////
/// Time Function
/////////////////////////////////////////////
/////////////////////////////////////////////

export async function TimeFunction(
  page,
  jsonData,
  listNotFound,
  POLL_INTERVAL,
  TIMEOUT
) {
  let result;
  let timeFrameArray;
  await delay(1000);

  const listNameSelector = await page.waitForSelector(
    "body > div.js-rootresizer__contents.layout-with-border-radius > div.layout__area--right > div > div.widgetbar-pages > div.widgetbar-pagescontent > div.widgetbar-page.active > div.widget-X9EuSe_t.widgetbar-widget.widgetbar-widget-watchlist > div.widgetHeader-X9EuSe_t > div > div > div.leftSlot-u7Ufi_N7.widgetbarWidgetHeaderLeftSlot-mQBvegEO > div > div > span.titleRow-mQBvegEO"
  );

  const listName = await page.evaluate(
    (listBtn) => listBtn.textContent,
    listNameSelector
  );

  // console.log("i am list name", listName);

  function getSelectors(key1, key2, key3) {
    const result = [
      timeFramesSelectors[key1],
      timeFramesSelectors[key2],
      timeFramesSelectors[key3],
    ];

    return result;
  }

  function checkKeysAvailability(...keys) {
    let missingKeys = [];

    // Iterate over each provided key
    keys.forEach((key) => {
      if (!(key in timeFramesSelectors)) {
        missingKeys.push(key); // Add to missingKeys if the key is not found
      }
    });

    // Return the missing keys or null if all keys are found
    return missingKeys.length > 0 ? missingKeys : [];
  }

  if (listName == jsonData.defaultList && !process.argv[2]) {
    // console.log("deafult list is already selected");
  } else {
    const favListBtn = await page.$(
      "body > div.js-rootresizer__contents.layout-with-border-radius > div.layout__area--right > div > div.widgetbar-pages > div.widgetbar-pagescontent > div.widgetbar-page.active > div.widget-X9EuSe_t.widgetbar-widget.widgetbar-widget-watchlist > div.widgetHeader-X9EuSe_t > div > div > div.leftSlot-u7Ufi_N7.widgetbarWidgetHeaderLeftSlot-mQBvegEO > div > div > span.titleRow-mQBvegEO"
    ); // Wait for the email input field to load

    await page.evaluate((listBtn) => listBtn.click(), favListBtn);

    // const favList = await page.$$('.listContainer-XuENC387 > div > div ')

    await new Promise((resolve) => setTimeout(resolve, 7000));

    const favList = await page.$$(
      "#overlap-manager-root > div:nth-child(2) > div > div.dialog-qyCw0PaN.dialog-b8SxMnzX.dialog-XuENC387.dialog-aRAWUDhF.rounded-aRAWUDhF.shadowed-aRAWUDhF > div > div.wrapper-nGEmjtaX > div.dialogContent-XuENC387 > div > div > div > div > div"
    );

    // console.log("i am total list : ", favList.length);

    // Define the title you want to match
    const targetTitle = process.argv[2];
    const defaultList = jsonData.defaultList;
    // Initialize a flag to check if the title was found
    let titleFound = false;

    for (const fav of favList) {
      const title = await fav.evaluate((el) => {
        // Find the child element with a class name that starts with "title"
        const titleElement = el.querySelector('[class^="title"]');
        return titleElement
          ? titleElement.textContent.trim()
          : "Title not found";
      });

      // console.log("Title: ", title);

      if (title === targetTitle) {
        // console.log(`Found matching title: ${title}, clicking it.`);
        // Click on the title element
        await fav.evaluate((el) => {
          const titleElement = el.querySelector('[class^="title"]');
          if (titleElement) {
            titleElement.click();
          }
        });
        titleFound = true; // Mark that the title was found
        break; // Stop the loop once the title is found and clicked
      }
    }

    // If `process.argv[2]` is not provided, handle that scenario
    if (!process.argv[2]) {
      // console.log("No title provided, clicking default list item.");
      for (const fav of favList) {
        const title = await fav.evaluate((el) => {
          // Find the child element with a class name that starts with "title"
          const titleElement = el.querySelector('[class^="title"]');
          return titleElement
            ? titleElement.textContent.trim()
            : "Title not found";
        });

        // console.log("Title: ", title);

        if (title === defaultList) {
          // console.log(`Found matching title: ${title}, clicking it.`);
          // Click on the title element
          await fav.evaluate((el) => {
            const titleElement = el.querySelector('[class^="title"]');
            if (titleElement) {
              titleElement.click();
            }
          });
          titleFound = true; // Mark that the title was found
          break; // Stop the loop once the title is found and clicked
        }
      }
      // console.log("Clicked default list item.");
    }

    if (!titleFound) {
      listNotFound = true;
      // If no matching title was found after checking all items
      await page.evaluate(
        (title) => {
          alert(`No list found with the given name "${title}"`);
        },
        targetTitle ? targetTitle : defaultList
      );
      // console.log("No matching title found.");
    }
  }
  timeFrameArray = getSelectors(
    jsonData.timeFrame1,
    jsonData.timeFrame2,
    jsonData.timeFrame3
  );
  // Example usage:
  result = checkKeysAvailability(
    jsonData.timeFrame1,
    jsonData.timeFrame2,
    jsonData.timeFrame3
  );

  // console.log("i am result outside", result);

  await new Promise((resolve) => setTimeout(resolve, 3000));
  const totalCompanies = await page.$$(
    "body > div.js-rootresizer__contents.layout-with-border-radius > div.layout__area--right > div > div.widgetbar-pages > div.widgetbar-pagescontent > div.widgetbar-page.active > div.widget-X9EuSe_t.widgetbar-widget.widgetbar-widget-watchlist > div.widgetbar-widgetbody > div > div > div > div.content-g71rrBCn > div > div > div.listContainer-MgF6KBas > div > div"
  ); // Wait for the email input field to load

  // console.log("I am total companies stock", totalCompanies.length);

  for (let i = 1; i < totalCompanies.length; i++) {
    if (result?.length > 0) {
      // If no matching title was found after checking all items
      await page.evaluate((timeFrame) => {
        const formattedResult = timeFrame.join(", ");
        alert(
          `Wrong timefrmae is mentioned in the config file "${formattedResult}"`
        );
      }, result);
      break;
    }

    if (listNotFound) {
      // console.log("List not found");
      break;
    }
    if (i == totalCompanies.length - 1) {
      // console.log("i am last company");
      continue;
    }
    // console.log("I am inside the companies loop");
    if (i > 1) {
      // console.log("I am inside the companies loop if condition");
      await new Promise((resolve) => setTimeout(resolve, jsonData.waitingTime));
    }
    const stockComany = await page.waitForSelector(
      `body > div.js-rootresizer__contents.layout-with-border-radius > div.layout__area--right > div > div.widgetbar-pages > div.widgetbar-pagescontent > div.widgetbar-page.active > div.widget-X9EuSe_t.widgetbar-widget.widgetbar-widget-watchlist > div.widgetbar-widgetbody > div > div > div > div.content-g71rrBCn > div > div > div.listContainer-MgF6KBas > div div:nth-child(${
        i + 1 == totalCompanies.length ? i : i + 1
      })  > div > div > span.cell-RsFlttSS.last-RsFlttSS`
    );
    // await page.evaluate(element => element.click(), stockComany)
    await page.click(
      `body > div.js-rootresizer__contents.layout-with-border-radius > div.layout__area--right > div > div.widgetbar-pages > div.widgetbar-pagescontent > div.widgetbar-page.active > div.widget-X9EuSe_t.widgetbar-widget.widgetbar-widget-watchlist > div.widgetbar-widgetbody > div > div > div > div.content-g71rrBCn > div > div > div.listContainer-MgF6KBas > div div:nth-child(${
        i + 1 == totalCompanies.length ? i : i + 1
      })  > div > div > span.cell-RsFlttSS.last-RsFlttSS`,
      { clickCount: 2 }
    );

    await new Promise((resolve) => setTimeout(resolve, 3000));
    const stockPriceSelector =
      "body > div.js-rootresizer__contents.layout-with-border-radius > div.layout__area--right > div > div.widgetbar-pages > div.widgetbar-pagescontent > div.widgetbar-page.active > div.widget-X9EuSe_t.widgetbar-widget.widgetbar-widget-detail > div.widgetbar-widgetbody > div > div.wrapper-Tv7LSjUz > div.container-qWcO4bp9.widgetWrapper-BSF4XTsE.userSelectText-BSF4XTsE.offsetDisabled-BSF4XTsE > span.priceWrapper-qWcO4bp9 > span.highlight-maJ2WnzA.price-qWcO4bp9";
    const startTime = Date.now();

    while (Date.now() - startTime < TIMEOUT) {
      const element = await page.$(stockPriceSelector);

      if (element) {
        const textContent = await page.evaluate(
          (el) => el.textContent.trim(),
          element
        );

        // Check if textContent is a number
        if (!isNaN(parseFloat(textContent))) {
          // console.log(`Number found: ${textContent}`);
          break; // Exit loop if a number is found
        } else {
          // console.log(`Not a number: ${textContent}`);
        }
      } else {
        // console.log("Element not found");
      }

      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL)); // Wait before the next check
    }
    for (let time = 0; time < timeFrameArray.length; time++) {
      const timeSelector = await page.waitForSelector(
        "#header-toolbar-intervals > button > div > div"
      );

      const currenTime = await page.evaluate(
        (time) => time.innerHTML.trim(),
        timeSelector
      );

      // console.log("I am time frmae", currenTime);

      if (
        currenTime ==
          (process.argv[3]
            ? convertTimeFrame(process.argv[3])
            : convertTimeFrame(jsonData.recordingTimeFrame)) &&
        time == 0
      ) {
        // console.log("the time is same ");
        continue;
      }
      if (time > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, jsonData.waitingTime)
        );
      } else {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
      const timeFrameBtn = await page.waitForSelector(
        "#header-toolbar-intervals > button > div > div"
      ); // Wait for the email input field to load
      await page.evaluate((element) => element.click(), timeFrameBtn);

      const timeFrame = await page.waitForSelector(timeFrameArray[time]);
      // const elementHTML = await page.evaluate(el => el.innerHTML, timeFrame)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      await page.evaluate((element) => element.click(), timeFrame);
    }
  }
}




//////////////////////////////////////////////
//////////////////////////////////////////////
/// Keyboard Function
/////////////////////////////////////////////
/////////////////////////////////////////////




export async function KeyboardFunction( page,
  jsonData,
  listNotFound,
  POLL_INTERVAL,
  TIMEOUT, nextCompany, previousCompany, nextCompanyItteration, waitForSpaceBar){
  let result;
      let timeFrameArray;
      await delay(1000);

      const listNameSelector = await page.waitForSelector(
        "body > div.js-rootresizer__contents.layout-with-border-radius > div.layout__area--right > div > div.widgetbar-pages > div.widgetbar-pagescontent > div.widgetbar-page.active > div.widget-X9EuSe_t.widgetbar-widget.widgetbar-widget-watchlist > div.widgetHeader-X9EuSe_t > div > div > div.leftSlot-u7Ufi_N7.widgetbarWidgetHeaderLeftSlot-mQBvegEO > div > div > span.titleRow-mQBvegEO"
      );

      const listName = await page.evaluate(
        (listBtn) => listBtn.textContent,
        listNameSelector
      );

      // console.log("i am list name", listName);

      function getSelectors(key1, key2, key3) {
        const result = [
          timeFramesSelectors[key1],
          timeFramesSelectors[key2],
          timeFramesSelectors[key3],
        ];

        return result;
      }

      function checkKeysAvailability(...keys) {
        let missingKeys = [];

        // Iterate over each provided key
        keys.forEach((key) => {
          if (!(key in timeFramesSelectors)) {
            missingKeys.push(key); // Add to missingKeys if the key is not found
          }
        });

        // Return the missing keys or null if all keys are found
        return missingKeys.length > 0 ? missingKeys : [];
      }

      if (listName == jsonData.defaultList && !process.argv[2]) {
        // console.log("deafult list is already selected");
      } else {
        const favListBtn = await page.$(
          "body > div.js-rootresizer__contents.layout-with-border-radius > div.layout__area--right > div > div.widgetbar-pages > div.widgetbar-pagescontent > div.widgetbar-page.active > div.widget-X9EuSe_t.widgetbar-widget.widgetbar-widget-watchlist > div.widgetHeader-X9EuSe_t > div > div > div.leftSlot-u7Ufi_N7.widgetbarWidgetHeaderLeftSlot-mQBvegEO > div > div > span.titleRow-mQBvegEO"
        ); // Wait for the email input field to load

        await page.evaluate((listBtn) => listBtn.click(), favListBtn);

        // const favList = await page.$$('.listContainer-XuENC387 > div > div ')

        await new Promise((resolve) => setTimeout(resolve, 7000));

        const favList = await page.$$(
          "#overlap-manager-root > div:nth-child(2) > div > div.dialog-qyCw0PaN.dialog-b8SxMnzX.dialog-XuENC387.dialog-aRAWUDhF.rounded-aRAWUDhF.shadowed-aRAWUDhF > div > div.wrapper-nGEmjtaX > div.dialogContent-XuENC387 > div > div > div > div > div"
        );

        // console.log("i am total list : ", favList.length);

        // Define the title you want to match
        const targetTitle = process.argv[2];
        const defaultList = jsonData.defaultList;
        // Initialize a flag to check if the title was found
        let titleFound = false;

        for (const fav of favList) {
          const title = await fav.evaluate((el) => {
            // Find the child element with a class name that starts with "title"
            const titleElement = el.querySelector('[class^="title"]');
            return titleElement
              ? titleElement.textContent.trim()
              : "Title not found";
          });

          // console.log("Title: ", title);

          if (title === targetTitle) {
            // console.log(`Found matching title: ${title}, clicking it.`);
            // Click on the title element
            await fav.evaluate((el) => {
              const titleElement = el.querySelector('[class^="title"]');
              if (titleElement) {
                titleElement.click();
              }
            });
            titleFound = true; // Mark that the title was found
            break; // Stop the loop once the title is found and clicked
          }
        }

        // If `process.argv[2]` is not provided, handle that scenario
        if (!process.argv[2]) {
          // console.log("No title provided, clicking default list item.");
          for (const fav of favList) {
            const title = await fav.evaluate((el) => {
              // Find the child element with a class name that starts with "title"
              const titleElement = el.querySelector('[class^="title"]');
              return titleElement
                ? titleElement.textContent.trim()
                : "Title not found";
            });

            // console.log("Title: ", title);

            if (title === defaultList) {
              // console.log(`Found matching title: ${title}, clicking it.`);
              // Click on the title element
              await fav.evaluate((el) => {
                const titleElement = el.querySelector('[class^="title"]');
                if (titleElement) {
                  titleElement.click();
                }
              });
              titleFound = true; // Mark that the title was found
              break; // Stop the loop once the title is found and clicked
            }
          }
          // console.log("Clicked default list item.");
        }

        if (!titleFound) {
          listNotFound = true;
          // If no matching title was found after checking all items
          await page.evaluate(
            (title) => {
              alert(`No list found with the given name "${title}"`);
            },
            targetTitle ? targetTitle : defaultList
          );
          // console.log("No matching title found.");
        }

        
      }
      timeFrameArray = getSelectors(
        jsonData.timeFrame1,
        jsonData.timeFrame2,
        jsonData.timeFrame3
      );
      // Example usage:
      result = checkKeysAvailability(
        jsonData.timeFrame1,
        jsonData.timeFrame2,
        jsonData.timeFrame3
      );

      // console.log("i am result outside", result);

      await new Promise((resolve) => setTimeout(resolve, 3000));
      const totalCompanies = await page.$$(
        "body > div.js-rootresizer__contents.layout-with-border-radius > div.layout__area--right > div > div.widgetbar-pages > div.widgetbar-pagescontent > div.widgetbar-page.active > div.widget-X9EuSe_t.widgetbar-widget.widgetbar-widget-watchlist > div.widgetbar-widgetbody > div > div > div > div.content-g71rrBCn > div > div > div.listContainer-MgF6KBas > div > div"
      ); // Wait for the email input field to load

      // console.log("I am total companies stock", totalCompanies.length);

      for (let i = 1; i < totalCompanies.length; i++) {
        if (result?.length > 0) {
          // If no matching title was found after checking all items
          await page.evaluate((timeFrame) => {
            const formattedResult = timeFrame.join(", ");
            alert(
              `Wrong timefrmae is mentioned in the config file "${formattedResult}"`
            );
          }, result);
          break;
        }
        if (listNotFound) {
          // console.log("List not found");
          break;
        }
        // console.log("I am always i: ", i);
        if (
          (previousCompany && i == 1) ||
          (nextCompanyItteration && i == totalCompanies.length - 2)
        ) {
          previousCompany = false;
          nextCompanyItteration = false;
          // console.log("first company and cant go previous more");
          i--;
        } else {
          // console.log("i am i ater the decrement ", i);
          // Check if the Tab key was pressed

          if (i == totalCompanies.length - 1) {
            // console.log("i am last company");
            continue;
          }
          // console.log("I am inside the companies loop");
          if (i > 1) {
            await page.evaluate(() => {
              document.activeElement.blur();
              document.body.focus();
            });
            // console.log("I am inside the companies loop if condition");

            if (nextCompany) {
              nextCompany = false;
              previousCompany = false;
              nextCompanyItteration = false;
            } else {
              await waitForSpaceBar(page);
            }

            await page.evaluate(() => {
              document.activeElement.blur();
              document.body.focus();
            });
          }
          const stockComany = await page.waitForSelector(
            `body > div.js-rootresizer__contents.layout-with-border-radius > div.layout__area--right > div > div.widgetbar-pages > div.widgetbar-pagescontent > div.widgetbar-page.active > div.widget-X9EuSe_t.widgetbar-widget.widgetbar-widget-watchlist > div.widgetbar-widgetbody > div > div > div > div.content-g71rrBCn > div > div > div.listContainer-MgF6KBas > div div:nth-child(${
              i + 1 == totalCompanies.length ? i : i + 1
            })  > div > div > span.cell-RsFlttSS.last-RsFlttSS`
          );
          // await page.evaluate(element => element.click(), stockComany)
          await page.click(
            `body > div.js-rootresizer__contents.layout-with-border-radius > div.layout__area--right > div > div.widgetbar-pages > div.widgetbar-pagescontent > div.widgetbar-page.active > div.widget-X9EuSe_t.widgetbar-widget.widgetbar-widget-watchlist > div.widgetbar-widgetbody > div > div > div > div.content-g71rrBCn > div > div > div.listContainer-MgF6KBas > div div:nth-child(${
              i + 1 == totalCompanies.length ? i : i + 1
            })  > div > div > span.cell-RsFlttSS.last-RsFlttSS`,
            { clickCount: 2 }
          );
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const stockPriceSelector =
            "body > div.js-rootresizer__contents.layout-with-border-radius > div.layout__area--right > div > div.widgetbar-pages > div.widgetbar-pagescontent > div.widgetbar-page.active > div.widget-X9EuSe_t.widgetbar-widget.widgetbar-widget-detail > div.widgetbar-widgetbody > div > div.wrapper-Tv7LSjUz > div.container-qWcO4bp9.widgetWrapper-BSF4XTsE.userSelectText-BSF4XTsE.offsetDisabled-BSF4XTsE > span.priceWrapper-qWcO4bp9 > span.highlight-maJ2WnzA.price-qWcO4bp9";
          const startTime = Date.now();

          while (Date.now() - startTime < TIMEOUT) {
            const element = await page.$(stockPriceSelector);

            if (element) {
              const textContent = await page.evaluate(
                (el) => el.textContent.trim(),
                element
              );

              // Check if textContent is a number
              if (!isNaN(parseFloat(textContent))) {
                // console.log(`Number found: ${textContent}`);
                break; // Exit loop if a number is found
              } else {
                // console.log(`Not a number: ${textContent}`);
              }
            } else {
              // console.log("Element not found");
            }

            await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL)); // Wait before the next check
          }
          for (let time = 0; time < timeFrameArray.length; time++) {
            // console.log("I am the timeFrame loop");
            const timeSelector = await page.waitForSelector(
              "div.titleWrapper-l31H9iuA.intervalTitle-l31H9iuA.apply-overflow-tooltip.withDot-l31H9iuA.apply-common-tooltip.withAction-l31H9iuA > button"
            );

            const currenTime = await page.evaluate(
              (time) => time.textContent,
              timeSelector
            );

            if (currenTime == jsonData.timeFrame1 && time == 0) {
              // console.log("the time is same ");
              continue;
            }

            if (time > 0) {
              await page.evaluate(() => {
                document.activeElement.blur();
                document.body.focus();
              });
              const keyResult = await waitForSpaceBar(page);
              // If Tab is pressed, break the loop
              if (keyResult.key === "Tab") {
                // console.log(`Tab key pressed. Moving to the next company...`);
                if (i == totalCompanies.length - 2) {
                  // console.log("i am the last stock");
                  await page.evaluate(() => {
                    alert(
                      "We can't go on the next stock because we are on the last stock"
                    );
                  });
                  nextCompanyItteration = true;
                  i = i - 1;
                  break;
                } else {
                  // console.log("I am the else block of tab button");

                  nextCompany = true;
                  break; // Skip to the next iteration of the parent loop
                }
              } else if (keyResult.key === "Control") {
                // console.log(`key Control. Moving to the previous company...`);
                if (i === 1) {
                  // Check some condition after the action
                  await page.evaluate(() => {
                    alert(
                      "We can't go on the previous stock because we are on the first stock"
                    );
                  });
                  previousCompany = true;
                  i = i - 1;
                  break;
                } else {
                  // console.log("I am the else block of delete button");
                  nextCompany = true;
                  // console.log("i am i before the decrement ", i);
                  i = i - 2;
                  break; // Skip to the next iteration of the parent loop
                }
              }
              await page.evaluate(() => {
                document.activeElement.blur();
                document.body.focus();
              });
            } else {
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
            const timeFrameBtn = await page.waitForSelector(
              "#header-toolbar-intervals > button > div > div"
            ); // Wait for the email input field to load
            await page.evaluate((element) => element.click(), timeFrameBtn);

            const timeFrame = await page.waitForSelector(timeFrameArray[time]);
            // const elementHTML = await page.evaluate(el => el.innerHTML, timeFrame)
            await new Promise((resolve) => setTimeout(resolve, 1000));

            await page.evaluate((element) => element.click(), timeFrame);
          }
        }
      }
}