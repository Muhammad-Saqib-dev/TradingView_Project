import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs";
import path from "path";

// Function to read and parse JSON data
function readJSONFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading or parsing JSON file: ${err}`);
    return null;
  }
}

// Use the data in your script
const jsonData = readJSONFile("./config.json");

async function waitForSpaceBar(page) {
  return await page.evaluate(() => {
    return new Promise((resolve) => {
      const keyHandler = (event) => {
        console.log(`Key pressed: ${event.key}`); // Log key press for debugging
        if (
          event.key === "Enter" ||
          event.key === "Tab" ||
          event.key === "Control"
        ) {
          window.removeEventListener("keydown", keyHandler);
          resolve({ key: event.key });
        }
      };
      window.addEventListener("keydown", keyHandler);
      console.log(
        "Press Enter to continue, Tab to break the loop, or Control to go back..."
      );
    });
  });
}

function ensureDirSync(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Get the current date formatted as YYYY-MM-DD
function getCurrentDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const day = String(now.getDate()).padStart(2, "0");
  return `${day}-${month}-${year}`;
}

function getUniqueFileName(dir, baseName, extension) {
  let fileName = `${baseName}${extension}`;
  let counter = 1;

  while (fs.existsSync(path.join(dir, fileName))) {
    fileName = `${baseName}_${counter}${extension}`;
    counter++;
  }

  return fileName;
}

puppeteer.use(StealthPlugin());

const URL = "https://www.tradingview.com/chart/k4N4Qr4X/?symbol=NSE%3ARELIANCE";

const BROWSER_PATH =
  //   '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"; // Change this path to your desired browser's path

// Function to save cookies to a file
async function saveCookies(page, filePath) {
  const cookies = await page.cookies();
  fs.writeFileSync(filePath, JSON.stringify(cookies, null, 2));
}

// Function to load cookies from a file
async function loadCookies(page, filePath) {
  const cookies = JSON.parse(fs.readFileSync(filePath));
  await page.setCookie(...cookies);
}

const timeFramesSelectors = {
  "1s": "#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(10) > div > span.labelRow-jFqVJoPk",
  "5s": "#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(11) > div > span.labelRow-jFqVJoPk",
  "10s":
    "#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(12) > div > span.labelRow-jFqVJoPk",
  "15s":
    "#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(13) > div > span.labelRow-jFqVJoPk",
  "30s":
    "#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(14) > div > span.labelRow-jFqVJoPk",
  "45s":
    "#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(15) > div > span.labelRow-jFqVJoPk",
  "1m": "#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(18) > div > span.labelRow-jFqVJoPk",
  "2m": "#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(19) > div > span.labelRow-jFqVJoPk",
  "3m": "#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(20) > div > span.labelRow-jFqVJoPk",
  "5m": "#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(21) > div > span.labelRow-jFqVJoPk",
  "10m":
    "#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(22) > div > span.labelRow-jFqVJoPk",
  "15m":
    "#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(23) > div > span.labelRow-jFqVJoPk",
  "30m":
    "#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(24) > div > span.labelRow-jFqVJoPk",
  "45m":
    "#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(25) > div > span.labelRow-jFqVJoPk",
  "1h": "#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(28) > div > span.labelRow-jFqVJoPk",
  "2h": "#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(29) > div > span.labelRow-jFqVJoPk",
  "3h": "#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(30) > div > span.labelRow-jFqVJoPk",
  "4h": "#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(31) > div > span.labelRow-jFqVJoPk",
  "1D": "#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(34) > div > span.labelRow-jFqVJoPk",
  "1W": "#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(35) > div > span.labelRow-jFqVJoPk",
  "1M": "#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(36) > div > span.labelRow-jFqVJoPk",
  "3M": "#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(37) > div > span.labelRow-jFqVJoPk",
  "6M": "#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(38) > div > span.labelRow-jFqVJoPk",
  "12M":
    "#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(39) > div > span.labelRow-jFqVJoPk",
};

function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

let browser;
let nextCompany = false;
let previousCompany = false;
let nextCompanyItteration = false;
let listNotFound = false;
const POLL_INTERVAL = 2000; // Interval in milliseconds between checks
const TIMEOUT = 60000; // Total timeout duration in milliseconds
const runTest = async () => {
  const cookieFilePath = "./cookies.json";

  try {
    // Launch a headful Chrome browser
    // ignoreing checking http errors(like authenticating(SSL))
    // want our page should take full width of browser
    browser = await puppeteer.launch({
      //   ignoreHTTPSErrors: true,
      headless: false,
      defaultViewport: null,
      // executablePath: BROWSER_PATH,
      args: [
        "--disable-features=IsolateOrigins,site-per-process",
        "--disable-site-isolation-trials",
        "--disable-popup-blocking",
      ],
      protocolTimeout: 0, // 0 means no timeout
    });

    // checking if page is created or not and then selecting the first page to work on otherwise creating a new page
    const pages = await browser.pages();
    const page = pages.length > 0 ? pages[0] : await browser.newPage();

    // Load cookies if they exist
    if (fs.existsSync(cookieFilePath)) {
      await loadCookies(page, cookieFilePath);
    }

    // Navigate to the website
    await page.goto(URL, {
      timeout: 180000,
      waitUntil: ["load", "domcontentloaded"],
    });

    const dateFolder = getCurrentDate();
    const screenshotsDir = path.join(jsonData.outputFolder, dateFolder);
    ensureDirSync(screenshotsDir);

    await page.evaluateHandle(
      async (dateFolder, data) => {
        // Initialize the flag to track the Tab key press

        document.addEventListener("keydown", async (event) => {
          if (event.key === "Shift") {
            // Handle Shift key press for taking screenshots
            const currentStock = document
              .querySelector(
                "div.titleWrapper-l31H9iuA.mainTitle-l31H9iuA.apply-overflow-tooltip.withDot-l31H9iuA.apply-common-tooltip.withAction-l31H9iuA > button"
              )
              .textContent.trim(); // Replace 'button' selector with the actual one
            const currentStockTimeFrame = document
              .querySelector(
                "div.titleWrapper-l31H9iuA.intervalTitle-l31H9iuA.apply-overflow-tooltip.withDot-l31H9iuA.apply-common-tooltip.withAction-l31H9iuA > button"
              )
              .textContent.trim(); // Replace 'another-button' selector with the actual one
            // Sanitize the stock name for file name
            console.log("i am current stock name", currentStock);
            const sanitizedStock = currentStock.replace(/[\/\\?%*:|"<>]/g, "-");

            const screenshotPath = `${data.outputFolder}/${dateFolder}/${sanitizedStock}-${currentStockTimeFrame}.png`;
            await window.puppeteerScreenshot(screenshotPath);
            console.log(`Screenshot saved: ${screenshotPath}`);
          }
        });
      },
      dateFolder,
      jsonData
    );

    await page.exposeFunction("puppeteerScreenshot", async (filePath) => {
      const baseName = path.basename(filePath, path.extname(filePath));
      const uniqueFileName = getUniqueFileName(
        screenshotsDir,
        baseName,
        path.extname(filePath)
      );
      const fullPath = path.join(screenshotsDir, uniqueFileName);
      await page.screenshot({ path: fullPath });
    });

    //Login in the website
    // craeting variable of the inputs and button of the login page
    const sidebarVisibleSelector = `button[aria-label="Watchlist, details and news"]`;

    //Login in the website
    // craeting variable of the inputs and button of the login page
    // const usernLoggedInSelector = '#tv-content > div > div > div > div > strong'
    const usernLoggedInSelector =
      "div.text-yrIMi47q.text_large-yrIMi47q > div > p:nth-child(1) > button";

    const stockPriceSelector =
      "body > div.js-rootresizer__contents.layout-with-border-radius > div.layout__area--right > div > div.widgetbar-pages > div.widgetbar-pagescontent > div.widgetbar-page.active > div.widget-X9EuSe_t.widgetbar-widget.widgetbar-widget-detail > div.widgetbar-widgetbody > div > div.wrapper-Tv7LSjUz > div.container-qWcO4bp9.widgetWrapper-BSF4XTsE.userSelectText-BSF4XTsE.offsetDisabled-BSF4XTsE > span.priceWrapper-qWcO4bp9 > span.highlight-maJ2WnzA.price-qWcO4bp9";

    const firstAvailableElement = await Promise.race([
      page
        .waitForSelector(usernLoggedInSelector, {
          visible: true,
          timeout: 60000,
        })
        .then(() => "Not LoggedIn"),
      page
        .waitForSelector(sidebarVisibleSelector, {
          visible: true,
          timeout: 60000,
        })
        .then(() => "sidebar visible"),
    ]);

    console.log("First available element:", firstAvailableElement);
    if (firstAvailableElement == "sidebar visible") {
      let stockPriceVisible = false;

      // While loop to check the visibility of the stock price and click sidebar if necessary
      while (!stockPriceVisible) {
        stockPriceVisible = await page.evaluate((selector) => {
          const element = document.querySelector(selector);
          return element !== null && element.offsetParent !== null; // Check if the stock price element is visible
        }, stockPriceSelector);

        if (!stockPriceVisible) {
          // Click on the sidebar to refresh the content
          await page.click(sidebarVisibleSelector);

          // Wait for 3 seconds before checking again
          await delay(4000);
        }
      }
    }

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

      await new Promise((resolve) => setTimeout(resolve, 4000));

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

      await new Promise((resolve) => setTimeout(resolve, 3000));
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

      console.log("Logged in status:", verificationChecking);

      if (
        verificationChecking == "Verfication Needed" ||
        verificationChecking == "Two factor Auth"
      ) {
        console.log("verification Needed");
        await new Promise((resolve) => setTimeout(resolve, 90000));
        await saveCookies(page, cookieFilePath);

        // Refresh the page
        await page.reload({
          timeout: 180000,
          waitUntil: ["load", "domcontentloaded"],
        });
      } else {
        console.log("Successfully loggedIn");
        await new Promise((resolve) => setTimeout(resolve, 7000));
        // Save the cookies after login
        await saveCookies(page, cookieFilePath);

        // Refresh the page
        await page.reload({
          timeout: 180000,
          waitUntil: ["load", "domcontentloaded"],
        });
      }

      const favListBtn = await page.$(
        "body > div.js-rootresizer__contents.layout-with-border-radius > div.layout__area--right > div > div.widgetbar-pages > div.widgetbar-pagescontent > div.widgetbar-page.active > div.widget-X9EuSe_t.widgetbar-widget.widgetbar-widget-watchlist > div.widgetHeader-X9EuSe_t > div > div > div.leftSlot-u7Ufi_N7.widgetbarWidgetHeaderLeftSlot-mQBvegEO > div > div > span.titleRow-mQBvegEO"
      ); // Wait for the email input field to load

      await page.evaluate((listBtn) => listBtn.click(), favListBtn);

      // const favList = await page.$$('.listContainer-XuENC387 > div > div ')

      await new Promise((resolve) => setTimeout(resolve, 7000));

      const favList = await page.$$(
        "#overlap-manager-root > div:nth-child(2) > div > div.dialog-qyCw0PaN.dialog-b8SxMnzX.dialog-XuENC387.dialog-aRAWUDhF.rounded-aRAWUDhF.shadowed-aRAWUDhF > div > div.wrapper-nGEmjtaX > div.dialogContent-XuENC387 > div > div > div > div > div"
      );

      console.log("i am total list : ", favList.length);

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

        console.log("Title: ", title);

        if (title === targetTitle) {
          console.log(`Found matching title: ${title}, clicking it.`);
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
        console.log("No title provided, clicking default list item.");
        for (const fav of favList) {
          const title = await fav.evaluate((el) => {
            // Find the child element with a class name that starts with "title"
            const titleElement = el.querySelector('[class^="title"]');
            return titleElement
              ? titleElement.textContent.trim()
              : "Title not found";
          });

          console.log("Title: ", title);

          if (title === defaultList) {
            console.log(`Found matching title: ${title}, clicking it.`);
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
        console.log("Clicked default list item.");
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
        console.log("No matching title found.");
      }

      function getSelectors(key1, key2, key3) {
        const result = [
          timeFramesSelectors[key1],
          timeFramesSelectors[key2],
          timeFramesSelectors[key3],
        ];

        return result;
      }

      const timeFrameArray = getSelectors(
        jsonData.timeFrame1,
        jsonData.timeFrame2,
        jsonData.timeFrame3
      );

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

      // Example usage:
      const result = checkKeysAvailability(
        jsonData.timeFrame1,
        jsonData.timeFrame2,
        jsonData.timeFrame3
      );

      await new Promise((resolve) => setTimeout(resolve, 3000));
      const totalCompanies = await page.$$(
        "body > div.js-rootresizer__contents.layout-with-border-radius > div.layout__area--right > div > div.widgetbar-pages > div.widgetbar-pagescontent > div.widgetbar-page.active > div.widget-X9EuSe_t.widgetbar-widget.widgetbar-widget-watchlist > div.widgetbar-widgetbody > div > div > div > div.content-g71rrBCn > div > div > div.listContainer-MgF6KBas > div > div"
      ); // Wait for the email input field to load

      console.log("I am total companies stock", totalCompanies.length);

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
          console.log("List not found");
          break;
        }
        console.log("I am always i: ", i);
        if (
          (previousCompany && i == 1) ||
          (nextCompanyItteration && i == totalCompanies.length - 2)
        ) {
          previousCompany = false;
          nextCompanyItteration = false;
          console.log("first company and cant go previous more");
          i--;
        } else {
          console.log("i am i ater the decrement ", i);
          // Check if the Tab key was pressed

          if (i == totalCompanies.length - 1) {
            console.log("i am last company");
            continue;
          }
          console.log("I am inside the companies loop");
          if (i > 1) {
            await page.evaluate(() => {
              document.activeElement.blur();
              document.body.focus();
            });
            console.log("I am inside the companies loop if condition");

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
                console.log(`Number found: ${textContent}`);
                break; // Exit loop if a number is found
              } else {
                console.log(`Not a number: ${textContent}`);
              }
            } else {
              console.log("Element not found");
            }

            await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL)); // Wait before the next check
          }
          for (let time = 0; time < timeFrameArray.length; time++) {
            console.log("I am the timeFrame loop");
            const timeSelector = await page.waitForSelector(
              "div.titleWrapper-l31H9iuA.intervalTitle-l31H9iuA.apply-overflow-tooltip.withDot-l31H9iuA.apply-common-tooltip.withAction-l31H9iuA > button"
            );

            const currenTime = await page.evaluate(
              (time) => time.textContent,
              timeSelector
            );

            if (currenTime == jsonData.timeFrame1 && time == 0) {
              console.log("the time is same ");
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
                console.log(`Tab key pressed. Moving to the next company...`);
                if (i == totalCompanies.length - 2) {
                  console.log("i am the last stock");
                  await page.evaluate(() => {
                    alert(
                      "We can't go on the next stock because we are on the last stock"
                    );
                  });
                  nextCompanyItteration = true;
                  i = i - 1;
                  break;
                } else {
                  console.log("I am the else block of tab button");

                  nextCompany = true;
                  break; // Skip to the next iteration of the parent loop
                }
              } else if (keyResult.key === "Control") {
                console.log(`key Control. Moving to the previous company...`);
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
                  console.log("I am the else block of delete button");
                  nextCompany = true;
                  console.log("i am i before the decrement ", i);
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

      // Save the cookies after login
    } else {
      ////////////////////////////////////////
      /// User already logged in
      ////////////////////////////////////////
      console.log("i am already logged in");
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

      console.log("i am list name", listName);

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
        console.log("deafult list is already selected");
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

        console.log("i am total list : ", favList.length);

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

          console.log("Title: ", title);

          if (title === targetTitle) {
            console.log(`Found matching title: ${title}, clicking it.`);
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
          console.log("No title provided, clicking default list item.");
          for (const fav of favList) {
            const title = await fav.evaluate((el) => {
              // Find the child element with a class name that starts with "title"
              const titleElement = el.querySelector('[class^="title"]');
              return titleElement
                ? titleElement.textContent.trim()
                : "Title not found";
            });

            console.log("Title: ", title);

            if (title === defaultList) {
              console.log(`Found matching title: ${title}, clicking it.`);
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
          console.log("Clicked default list item.");
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
          console.log("No matching title found.");
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

      console.log("i am result outside", result);

      await new Promise((resolve) => setTimeout(resolve, 3000));
      const totalCompanies = await page.$$(
        "body > div.js-rootresizer__contents.layout-with-border-radius > div.layout__area--right > div > div.widgetbar-pages > div.widgetbar-pagescontent > div.widgetbar-page.active > div.widget-X9EuSe_t.widgetbar-widget.widgetbar-widget-watchlist > div.widgetbar-widgetbody > div > div > div > div.content-g71rrBCn > div > div > div.listContainer-MgF6KBas > div > div"
      ); // Wait for the email input field to load

      console.log("I am total companies stock", totalCompanies.length);

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
          console.log("List not found");
          break;
        }
        console.log("I am always i: ", i);
        if (
          (previousCompany && i == 1) ||
          (nextCompanyItteration && i == totalCompanies.length - 2)
        ) {
          previousCompany = false;
          nextCompanyItteration = false;
          console.log("first company and cant go previous more");
          i--;
        } else {
          console.log("i am i ater the decrement ", i);
          // Check if the Tab key was pressed

          if (i == totalCompanies.length - 1) {
            console.log("i am last company");
            continue;
          }
          console.log("I am inside the companies loop");
          if (i > 1) {
            await page.evaluate(() => {
              document.activeElement.blur();
              document.body.focus();
            });
            console.log("I am inside the companies loop if condition");

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
                console.log(`Number found: ${textContent}`);
                break; // Exit loop if a number is found
              } else {
                console.log(`Not a number: ${textContent}`);
              }
            } else {
              console.log("Element not found");
            }

            await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL)); // Wait before the next check
          }
          for (let time = 0; time < timeFrameArray.length; time++) {
            console.log("I am the timeFrame loop");
            const timeSelector = await page.waitForSelector(
              "div.titleWrapper-l31H9iuA.intervalTitle-l31H9iuA.apply-overflow-tooltip.withDot-l31H9iuA.apply-common-tooltip.withAction-l31H9iuA > button"
            );

            const currenTime = await page.evaluate(
              (time) => time.textContent,
              timeSelector
            );

            if (currenTime == jsonData.timeFrame1 && time == 0) {
              console.log("the time is same ");
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
                console.log(`Tab key pressed. Moving to the next company...`);
                if (i == totalCompanies.length - 2) {
                  console.log("i am the last stock");
                  await page.evaluate(() => {
                    alert(
                      "We can't go on the next stock because we are on the last stock"
                    );
                  });
                  nextCompanyItteration = true;
                  i = i - 1;
                  break;
                } else {
                  console.log("I am the else block of tab button");

                  nextCompany = true;
                  break; // Skip to the next iteration of the parent loop
                }
              } else if (keyResult.key === "Control") {
                console.log(`key Control. Moving to the previous company...`);
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
                  console.log("I am the else block of delete button");
                  nextCompany = true;
                  console.log("i am i before the decrement ", i);
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

    console.log("Test Finished");
    // Close the browser
  } catch (error) {
    console.log(error);
  } finally {
    // await browser.close()
  }
};

runTest();
