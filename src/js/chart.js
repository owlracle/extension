import * as LightweightCharts from 'lightweight-charts';
import Request from './helpers/request.js';
import Network from './helpers/network.js';
import storage from './helpers/storage.js';
import ModalWindow from './components/modal.js';
import menu from './components/menu.js';
import login from './helpers/login.js';
import Button from './components/button.js';
import ModalMenu from './components/modalMenu.js';


// create price chart
export default {
    ready: false,
    timeframe: 60,
    page: 1,
    candles: 100,
    lastCandle: (Date.now() / 1000).toFixed(0),
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

    loadImgCache: async function () {
        // preload images
        this.imgCache = await (async () => {
            const website = 'https://owlracle.info';

            Object.values(await Network.getList()).forEach(e => {
                e.icon = document.createElement('img');
                e.icon.src = `${website}/img/${e.symbol}.png`;
            });

            return Object.fromEntries([
                ...['candle-chart', 'line-chart'].map(e => {
                    const img = document.createElement('img');
                    img.src = `${website}/img/${e}.png`;
                    return [e, img];
                }),
                ...['time-10', 'time-30', 'time-60', 'time-120', 'time-240', 'time-1440'].map(e => {
                    const img = document.createElement('img');
                    img.src = `img/${e}.png`;
                    return [e, img];
                })
            ]);
        })();
    },

    init: async function () {
        this.network = (await new Network().get()).symbol;
        await this.loadImgCache();

        document.querySelector('#content #chart.item').innerHTML = `
                <div class="row">
                    <div id="timeframe-switcher"></div>
                    <div id="style-switcher"></div>
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

        const container = document.querySelector('#chart.item #chart');
        const toolTip = document.createElement('div');
        toolTip.id = 'tooltip-chart';
        container.appendChild(toolTip);

        // hover mouse over candles
        this.obj.subscribeCrosshairMove(param => {
            if (param.point === undefined || !param.time || param.point.x < 0 || param.point.x > container.clientWidth || param.point.y < 0 || param.point.y > container.clientHeight) {
                toolTip.style.display = 'none';
                return;
            }
            
            toolTip.style.display = 'block';
            const visibleSerie = Object.keys(this.series).filter(e => this.series[e].visible)[0];
            const price = param.seriesData.get(this.series[visibleSerie].series);
            // console.log(price)
            if (!price || typeof price === 'number') {
                toolTip.style.display = 'none';
                return;
            }

            toolTip.innerHTML = Object.entries(price).map(([key, value]) => {
                if (key == 'time') return;

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
        });

        // dropdown time frame switcher
        this.btnTimeFrame = new Button().click(() => {
            new ModalMenu([
                { id: 'tf-10', image: this.imgCache['time-10'].src, text: `10 minutes`, action: () => this.timeframeSwitch('10') },
                { id: 'tf-30', image: this.imgCache['time-30'].src, text: `30 minutes`, action: () => this.timeframeSwitch('30') },
                { id: 'tf-60', image: this.imgCache['time-60'].src, text: `1 hour`, action: () => this.timeframeSwitch('60') },
                { id: 'tf-120', image: this.imgCache['time-120'].src, text: `2 hours`, action: () => this.timeframeSwitch('120') },
                { id: 'tf-240', image: this.imgCache['time-240'].src, text: `4 hours`, action: () => this.timeframeSwitch('240') },
                { id: 'tf-1440', image: this.imgCache['time-1440'].src, text: `1 day`, action: () => this.timeframeSwitch('1440') },
            ], { customClass: 'vertical' });
        }).append(document.querySelector('#content #chart.item #timeframe-switcher'));
        
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
        this.btnStyleSwitcher = new Button().click(() => {
            new ModalMenu([
                { id: 'style-area', image: this.imgCache['line-chart'].src, text: `Area`, action: () => changeStyle('area') },
                { id: 'style-candlestick', image: this.imgCache['candle-chart'].src, text: `Candlestick`, action: () => changeStyle('candlestick') },
            ], {customClass: 'vertical'});
        }).append(document.querySelector('#content #chart.item #style-switcher'));

        const changeStyle = async (styleMode) => {
            if (this.queryHistory) return;

            this.btnStyleSwitcher.setText(`<i class="fas fa-spin fa-cog"></i>`);
            const serie = this.series[this.mode];
            const style = this.preferences[this.mode] = styleMode;
            serie.config = Object.assign({}, this.config[style]);

            this.queryHistory = true;
            const history = await this.getHistory(this.timeframe);

            this.obj.removeSeries(serie.series);
            serie.series = null;

            this.update(history);

            serie.series.applyOptions({ visible: serie.visible });

            this.btnStyleSwitcher.setText(`<img src="${this.imgCache[`${this.preferences[this.mode] == 'candlestick' ? 'candle' : 'line'}-chart`].src}">${this.preferences[this.mode][0].toUpperCase() + this.preferences[this.mode].slice(1)}`);

            this.setCookie();
            this.queryHistory = false;
        }

        this.setTheme('dark');
        document.querySelector(`#content #chart.item #chart i`).remove();

        this.ready = true;

        this.setMode('gas');

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

                this.btnStyleSwitcher.setText(`<img src="${this.imgCache[`${this.preferences[this.mode] == 'candlestick' ? 'candle' : 'line'}-chart`].src}">${this.preferences[this.mode][0].toUpperCase() + this.preferences[this.mode].slice(1)}`);
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
        const button = this.btnTimeFrame;

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

        button.setText(`<i class="fas fa-spin fa-cog"></i>`);

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
        button.setText(`<img src="${this.imgCache[`time-${time}`].src}">${text}`);

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
        data = data.candles || [];
        if (!data.length) return;

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
                    background: { color: background },
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
        this.network = (await new Network().get()).symbol;
        this.timeframe = timeframe;

        let query = {
            timeframe,
            page,
            candles,
            to: this.lastCandle,
            tokenprice: true,
            txfee: true,
        };

        const ak = await login.get('apikey');
        if (ak) {
            query.apikey = ak;
        }

        this.history = await new Request().get(`${this.network}/history`, query);
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

            // console.log(this.history);

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
