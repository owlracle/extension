import * as LightweightCharts from 'lightweight-charts';
import { login, imgCache, menu, serverURL } from './utils.js';
import Request from './helpers/request.js';
import network from './helpers/network.js';
import storage from './helpers/storage.js';
import ModalWindow from './components/modal.js';
import Dropdown from './components/dropdown.js';

// create price chart
export default {
    ready: false,
    timeframe: 60,
    page: 1,
    candles: 1000,
    lastCandle: (new Date().getTime() / 1000).toFixed(0),
    allRead: false,
    config: {
        area: {
            style: 'area',
            color: '#2962ff',
        },
        candlestick: {
            style: 'candlestick',
            colorUp: '#4CA69A',
            colorDown: '#E0544E',
        },
    },
    preferences: { gas: 'area', token: 'candlestick', fee: 'area' },

    init: async function () {
        this.network = (await network.get()).symbol;

        document.querySelector('#content #chart.item').innerHTML = `
                <div class="row">
                    <div id="timeframe-switcher"><button></button></div>
                    <div id="style-switcher"><button><img></button></div>
                </div>
                <div id="chart"><i class="fas fa-spin fa-cog"></i></div>
                <div id="toggle-container">
                    <button id="gas"><span class="mark"></span>Gas</button>
                    <button id="token"><span class="mark"></span>Token</button>
                    <button id="fee"><span class="mark"></span>Fee</button>
                </div>
            </div>`;

        this.obj = LightweightCharts.createChart(document.querySelector('#content #chart.item #chart'), {
            width: document.querySelector('#content').offsetWidth,
            height: 350,
            crosshair: {
                mode: LightweightCharts.CrosshairMode.Normal,
            },
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
            },
        });

        // load chart preferences cookie
        let chartCookie = await storage.get('chart');
        if (chartCookie) {
            // test each individually to unsure loading only valid values
            if (chartCookie.gas) {
                this.preferences.gas = chartCookie.gas;
            }
            if (chartCookie.token) {
                this.preferences.token = chartCookie.token;
            }
            if (chartCookie.fee) {
                this.preferences.fee = chartCookie.fee;
            }
            if (chartCookie.timeframe) {
                this.timeframe = chartCookie.timeframe;
            }
        }

        // copy object
        this.series = {
            gas: { config: Object.assign({}, this.config[this.preferences.gas]) },
            token: { config: Object.assign({}, this.config[this.preferences.token]) },
            fee: { config: Object.assign({}, this.config[this.preferences.fee]) },
        };

        // set modality buttons behaviour
        document.querySelectorAll(`#content #chart.item #toggle-container button`).forEach(e => e.addEventListener('click', () => this.setMode(e.id)));
        this.setMode('gas');

        const container = document.querySelector('#chart.item #chart');
        const toolTip = document.createElement('div');
        toolTip.id = 'tooltip-chart';
        container.appendChild(toolTip);

        // hover mouse over candles
        this.obj.subscribeCrosshairMove(param => {
            if (param.point === undefined || !param.time || param.point.x < 0 || param.point.x > container.clientWidth || param.point.y < 0 || param.point.y > container.clientHeight) {
                toolTip.style.display = 'none';
            }
            else {
                toolTip.style.display = 'block';

                const visibleSerie = Object.keys(this.series).filter(e => this.series[e].visible)[0];
                const price = param.seriesPrices.get(this.series[visibleSerie].series);
                // console.log(price)
                if (price && typeof price !== 'number') {
                    toolTip.innerHTML = Object.entries(price).map(([key, value]) => {
                        const name = key.charAt(0).toUpperCase() + key.slice(1);

                        // trunc to max 4 decimal places
                        if (value.toString().split('.').length >= 2 && value.toString().split('.')[1].length > 4) {
                            value = value.toString().split('.');
                            value = value[0] + '.' + value[1].slice(0, 4);
                        }

                        return `<div class="${key}"><span class="name">${name}</span>: ${value}</div>`;
                    }).join('');

                    const coordinateY = container.offsetTop + 10;
                    const coordinateX = container.offsetLeft + 10;

                    toolTip.style.left = `${coordinateX}px`;
                    toolTip.style.top = `${coordinateY}px`;
                }
                else {
                    toolTip.style.display = 'none';
                }
            }
        });

        // dropdown time frame switcher
        new Dropdown({
            button: document.querySelector('#content #chart.item #timeframe-switcher button'),
            itemList: [
                { id: 'tf-10', innerHTML: `<img class="icon" src="${imgCache['time-10'].src}">10 minutes` },
                { id: 'tf-30', innerHTML: `<img class="icon" src="${imgCache['time-30'].src}">30 minutes` },
                { id: 'tf-60', innerHTML: `<img class="icon" src="${imgCache['time-60'].src}">1 hour` },
                { id: 'tf-120', innerHTML: `<img class="icon" src="${imgCache['time-120'].src}">2 hours` },
                { id: 'tf-240', innerHTML: `<img class="icon" src="${imgCache['time-240'].src}">4 hours` },
                { id: 'tf-1440', innerHTML: `<img class="icon" src="${imgCache['time-1440'].src}">1 day` },
            ],
            clickFn: b => this.timeframeSwitch(b.id.split('tf-')[1]),
        });

        this.timeScale = this.obj.timeScale();

        this.timeScale.subscribeVisibleLogicalRangeChange(async () => {
            const logicalRange = this.timeScale.getVisibleLogicalRange();
            if (logicalRange !== null && logicalRange.from < 0 && this.history.length >= this.candles && !this.scrolling && !this.allRead) {
                this.scrolling = true;
                const oldHistory = this.history;
                const newHistory = await this.getHistory(this.timeframe, this.page + 1);
                this.history = [...oldHistory, ...newHistory];

                this.update(this.history);
                // console.log(this.history);
                this.page++;
                this.scrolling = false;

                if (newHistory.length == 0) {
                    this.allRead = true;
                }
            }
        });


        // set candle/area style buttons behaviour
        new Dropdown({
            button: document.querySelector('#content #chart.item #style-switcher button'),
            itemList: [
                { id: 'style-area', innerHTML: `<img class="icon" src="${imgCache['line-chart'].src}">Area` },
                { id: 'style-candlestick', innerHTML: `<img class="icon" src="${imgCache['candle-chart'].src}">Candlestick` },
            ],
            clickFn: async b => {
                if (this.queryHistory) {
                    return;
                }

                const styleswitcher = document.querySelector('#content #chart.item #style-switcher button');
                styleswitcher.innerHTML = `<i class="fas fa-spin fa-cog"></i>`;
                const serie = this.series[this.mode];
                const style = this.preferences[this.mode] = b.id.split('style-')[1];
                serie.config = Object.assign({}, this.config[style]);

                this.queryHistory = true;
                const history = await this.getHistory(this.timeframe);

                this.obj.removeSeries(serie.series);
                serie.series = null;

                this.update(history);

                serie.series.applyOptions({ visible: serie.visible });

                styleswitcher.innerHTML = `<img src="${imgCache[`${this.preferences[this.mode] == 'candlestick' ? 'candle' : 'line'}-chart`].src}">${this.preferences[this.mode][0].toUpperCase() + this.preferences[this.mode].slice(1)}`;

                this.setCookie();
                this.queryHistory = false;
            }
        });

        this.setTheme('dark');
        document.querySelector(`#content #chart.item #chart i`).remove();

        this.ready = true;

        return;
    },

    setMode: function (mode) {
        if (this.mode == mode || this.queryHistory) {
            return;
        }
        document.querySelectorAll(`#content #chart.item #toggle-container button`).forEach(a => {
            const series = this.series[a.id];
            if (a.id == mode) {
                a.classList.add('active');
                series.visible = true;
                this.mode = a.id;

                document.querySelector(`#content #chart.item #style-switcher button`).innerHTML = `<img src="${imgCache[`${this.preferences[this.mode] == 'candlestick' ? 'candle' : 'line'}-chart`].src}">${this.preferences[this.mode][0].toUpperCase() + this.preferences[this.mode].slice(1)}`;
            }
            else {
                a.classList.remove('active');
                series.visible = false;
            }

            if (series.series) {
                series.series.applyOptions({ visible: series.visible });
            }
        });
    },

    timeframeSwitch: async function (time) {
        if (!this.ready) {
            await this.init();
        }
        if (this.queryHistory) {
            return;
        }

        if (time) {
            this.timeframe = time;
        }
        else {
            time = this.timeframe;
        }


        const tfswitcher = document.querySelector('#content #chart.item #timeframe-switcher button');
        tfswitcher.innerHTML = `<i class="fas fa-spin fa-cog"></i>`;

        this.queryHistory = true;
        const history = await this.getHistory(time);

        const text = (time => {
            return ({
                10: '10 minutes',
                30: '30 minutes',
                60: '1 hour',
                120: '2 hours',
                240: '4 hours',
                1440: '1 day',
            })[time];
        })(time);
        tfswitcher.innerHTML = `<img src="${imgCache[`time-${time}`].src}">${text}`;

        this.update(history);
        this.setCookie();
        this.queryHistory = false;

        document.querySelectorAll(`#toggle-container button`).forEach(b => {
            const series = this.series[b.id];
            if (series.visible) {
                series.series.applyOptions({
                    visible: series.visible
                });
            }
        });
    },

    setCookie: function () {
        const cookieChart = Object.fromEntries(Object.entries(this.series).map(([k, v]) => [k, v.config.style]));
        cookieChart.timeframe = this.timeframe;
        storage.set('chart', cookieChart);
    },

    update: function (data) {
        // console.log(data);
        if (data.length) {
            const seriesName = { gas: 'gasPrice', token: 'tokenPrice', fee: 'txFee' };

            Object.entries(this.series).forEach(([key, value]) => {
                const speedData = data.map(e => {
                    if (value.config.style == 'candlestick') {
                        return {
                            // value: e[key].high,
                            open: e[seriesName[key]].open,
                            close: e[seriesName[key]].close,
                            low: e[seriesName[key]].low,
                            high: e[seriesName[key]].high,
                            time: parseInt(new Date(e.timestamp).getTime() / 1000),
                        }
                    }
                    return {
                        value: (e[seriesName[key]].close + e[seriesName[key]].open) / 2,
                        time: parseInt(new Date(e.timestamp).getTime() / 1000),
                    }
                }).reverse();

                if (!value.series) {
                    if (value.config.style == 'candlestick') {
                        value.series = this.obj.addCandlestickSeries({
                            upColor: value.config.colorUp,
                            downColor: value.config.colorDown,
                            borderDownColor: value.config.colorDown,
                            borderUpColor: value.config.colorUp,
                            wickDownColor: value.config.colorDOwn,
                            wickUpColor: value.config.colorUp,
                            visible: false,
                        });
                    }
                    else {
                        value.series = this.obj.addAreaSeries({
                            lineColor: value.config.color,
                            topColor: `${value.config.color}80`,
                            bottomColor: `${value.config.color}10`,
                            lineWidth: 2,
                            visible: false,
                        });
                    }
                }
                value.series.setData(speedData);
            });
        }
    },

    setTheme: function (name) {
        let background = '#232323';
        let text = '#e3dcd0';
        let lines = '#3c3c3c';

        if (name == 'light') {
            background = '#eeeeee';
            text = '#511814';
            lines = '#c9c9c9';
        }

        this.isReady().then(() => {
            this.obj.applyOptions({
                layout: {
                    backgroundColor: background,
                    textColor: text,
                },
                grid: {
                    vertLines: { color: lines },
                    horzLines: { color: lines },
                },
                rightPriceScale: { borderColor: lines },
                timeScale: { borderColor: lines },
            });
        });
    },

    getHistory: async function (timeframe = 60, page = 1, candles = this.candles) {
        this.network = (await network.get()).symbol;
        this.timeframe = timeframe;

        let query = {
            timeframe: timeframe,
            page: page,
            candles: candles,
            to: this.lastCandle,
            tokenprice: true,
            txfee: true,
        };

        const ak = await login.get('apikey');
        if (ak) {
            query.apikey = ak;
        }

        this.history = await new Request({ url: serverURL }).get(`${this.network}/history`, query);
        // console.log(this.history)
        if (this.history.error) {
            new ModalWindow({
                title: this.history.error,
                message: this.history.message,
                buttons: {
                    'LOGIN': () => menu.click('key'),
                    'CLOSE': () => {}
                }
            });

            console.log(this.history);

            if (this.history.error.status == 401) {
                return this.getHistory(timeframe, page, candles);
            }
            return [];
        }
        return this.history;
    },

    isReady: async function () {
        return this.ready || new Promise(resolve => setTimeout(() => resolve(this.isReady()), 10));
    }
};
