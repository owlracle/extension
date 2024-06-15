# Owlracle extension

<p align="center"><img src="https://user-images.githubusercontent.com/19828711/149074903-e46ed950-7f17-4546-9663-58c963bb330b.png"></p>

This is a Chrome extension for the Owlracle service.
If you don't know about Owlracle, I recommend you to visit [our website](https://owlracle.info).

Asked by the community, now Owlracle can be used without leaving your current tab, just opening the extension popup.

## Installation

Go to either [Chrome Web Store](https://microsoftedge.microsoft.com/addons/detail/owlracle/abfaclffknadhdmfojckfkkcfakcngfd?hl=en-US) or [Microsoft Edge Add-ons](https://chrome.google.com/webstore/detail/owlracle/gnedoldjklhjjhmcfpilokboppbceclh?hl=en-US) page and install the extension on your browser.

Alternatively, you could also download the latest release and manually install it.

* Download the zip file from the desired release.
* Extract the file contents into an empty folder.
* Head to the chrome extension settings: (_chrome://extensions/_) and make sure _Developer Mode_ is checked.
* Click on the _Load unpacked_ button, and select the folder you just put the zip contents into.
* Done!


## Usage

Just click on the new extension button that just appeared on your browser. A popup will show.

Once opened, you must choose to log in with your API key or use a guest login. Even the API limits on [our website](https://owlracle.info).

The extension has three menu buttons located at the bottom.

* The first is to check gas prices. It makes requests with the default Owlracle settings:

```
blocks = 200
percentile = 0.3
accept = 35,60,90,100
gasused = 184523
```

You can change the desired network on the button in the header, just like on our website.

<p align="center"><img src="https://github.com/owlracle/extension/assets/19828711/9493eefd-cbe1-4518-81bd-b4f27af60cc3"></p>

You can also change the gas used value clicking on the **Customize Fee** button. This will open a new window where you can choose from a list of predefined common operations.

<p align="center"><img src="https://github.com/owlracle/extension/assets/19828711/a28cef6e-3f1f-4b3d-810f-71be99b0d4df"></p>

Or if you want to change the predefined speeds (the accept values), you can click on the **Customize Speeds** button. This will allow you to change the acceptance values every one of the four speeds.

<p align="center"><img src="https://github.com/owlracle/extension/assets/19828711/eac62883-7ced-4c5c-b506-f913c6a93694"></p>



* The second tab is for gas price history. Just like on our website, you can change the timeframe (_10m_, _30m_, _1h_, _2h_, _4h_, _1d_), the chart style (_area_ or _candlesticks_) and the information you want to track (_gas price_, _token price_, _estimated gas fee_).

<p align="center"><img src="https://user-images.githubusercontent.com/19828711/171278819-9e9020cd-eec3-4c65-99c4-1177fb37cdab.png"></p>

* The third tab allows you to receive Owlracle's gas price recommendation right into your Metamask. If you check the option, any time you interact with a smart contract on a website, the transaction will have a custom gas price set by Owlracle API. Using this feature will cost your API **10%** of the estimated tx fee cost, but will never be higher than **$0.1**. 

<p align="center"><img src="https://user-images.githubusercontent.com/19828711/171279196-96df6df5-4e4b-4345-9a05-ad01f38d6b1d.png"></p>

* The fourth tab shows information about your API key, or a message asking for you to log in with your key if you still haven't. In this tab, you can see your _API credit_, _last hour API usage_, and _total API usage_, as well as a convenient link to our social media profiles.

<p align="center"><img src="https://user-images.githubusercontent.com/19828711/171279031-e0dbc3b0-4b13-45ad-8a95-0ac15ec3e3ea.png"></p>

That is it! I hope you enjoyed our extension and this brief tutorial.

**Soon more features will come to Owlracle extension. Stay tuned 👀**

---

## Contact us:

<span>
    <a href="https://twitter.com/0xowlracle">
    <img src="https://img.shields.io/badge/Twitter-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white">
    </a>
</span>
<span>
    <a href="https://owlracle.info/discord-general">
    <img src="https://img.shields.io/badge/discord-1DA1F2?style=for-the-badge&logo=discord&logoColor=white">
    </a>
</span>
<span>
    <a href="https://t.me/owlracle">
    <img src="https://img.shields.io/badge/Telegram-1DA1F2?style=for-the-badge&logo=telegram&logoColor=white">
    </a>
</span>
<span>
    <a href="https://github.com/owlracle">
    <img src="https://img.shields.io/badge/GitHub-1DA1F2?style=for-the-badge&logo=github&logoColor=white">
    </a>
</span>

