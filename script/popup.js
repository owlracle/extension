const apiKey = 'd766098dd42c4caebdf0fa7e344a2743';

document.addEventListener('DOMContentLoaded', async () => {

    // set the cookie utils object
    const cookies = {
        set: function(key, value, {expires, path}={}) {
            if (!expires){
                expires = 86400000;
            }
            if (!path){
                path = '/';
            }

            let expTime = 0;
            if (typeof expires === "object"){
                expTime += (expires.seconds * 1000) || 0;
                expTime += (expires.minutes * 1000 * 60) || 0;
                expTime += (expires.hours * 1000 * 60 * 60) || 0;
                expTime += (expires.days * 1000 * 60 * 60 * 24) || 0;
            }
            else {
                expTime = expires;
            }

            const now = new Date();
            expTime = now.setTime(now.getTime() + expTime);

            const cookieString = `${key}=${value};expires=${new Date(expTime).toUTCString()};path=${path}`;
            document.cookie = cookieString;
            return cookieString;
        },

        get: function(key) {
            const cookies = document.cookie.split(';').map(e => e.trim());
            const match = cookies.filter(e => e.split('=')[0] == key);
            return match.length ? match[0].split('=')[1] : false;
        },

        delete: function(key) {
            const cookies = document.cookie.split(';').map(e => e.trim());
            const match = cookies.filter(e => e.split('=')[0] == key);

            document.cookie = `${key}=0;expires=${new Date().toUTCString()}`;
            return match.length > 0;
        }
    };
    

    // set the corresponding network in header
    const network = {
        list: {
            eth: { symbol: 'eth', name: 'Ethereum', token: 'ETH', explorer: {
                icon: 'https://etherscan.io/images/favicon3.ico', href: 'https://etherscan.io', name: 'Etherscan', apiAvailable: true,
            } },
            avax: { symbol: 'avax', name: 'Avalanche', token: 'AVAX', explorer: {
                icon: 'https://snowtrace.io/images/favicon.ico', href: 'https://snowtrace.io', name: 'SnowTrace', apiAvailable: true,
            } },
            poly: { symbol: 'poly', name: 'Polygon', token: 'MATIC', explorer: {
                icon: 'https://polygonscan.com/images/favicon.ico', href: 'https://polygonscan.com', name: 'PolygonScan', apiAvailable: true,
            } },
            ftm: { symbol: 'ftm', name: 'Fantom', token: 'FTM', explorer: {
                icon: 'https://ftmscan.com/images/favicon.png', href: 'https://ftmscan.com', name: 'FtmScan', apiAvailable: true,
            } },
            bsc: { symbol: 'bsc', name: 'BSC', longName: 'Binance Smart Chain', token: 'BNB', explorer: {
                icon: 'https://bscscan.com/images/favicon.ico', href: 'https://bscscan.com', name: 'BscScan', apiAvailable: true,
            } },
            movr: { symbol: 'movr', name: 'Moonriver', token: 'MOVR', explorer: {
                icon: 'https://moonriver.moonscan.io/images/favicon.ico', href: 'https://moonriver.moonscan.io/', name: 'MoonScan', apiAvailable: true,
            } },
            cro: { symbol: 'cro', name: 'Cronos', token: 'CRO', explorer: {
                icon: 'https://cronos.crypto.org/explorer/images/favicon-32x32-1d2f176ba4e0bc1155947d52652a35c8.png', href: 'https://cronos.crypto.org/explorer/', name: 'Cronos Explorer', apiAvailable: false,
            } },
        },
        
        get: function(name) {
            if (!name){
                name = cookies.get('network') || 'bsc';
            }

            return this.list[name];
        },

        set: function(name){
            cookies.set('network', name, { expires: { days: 365 } });
        },

        getList: function() {
            return this.list;
        }
    }

    // preload network images
    Object.values(network.getList()).forEach(e => {
        e.icon = document.createElement('img');
        e.icon.src = `https://owlracle.info/img/${e.symbol}.png`;
    });



    // dropdown class
    class Dropdown {
        constructor({ button, itemList, position, clickFn }) {
            button.addEventListener('click', function() {
                const dropdown = document.createElement('div');
                dropdown.id = 'dropdown';
            
                itemList.forEach(e => {
                    const item = document.createElement('div');
                    item.classList.add('item');

                    item.innerHTML = e.innerHTML;

                    Object.entries(e).forEach(([k,v]) => {
                        if (k != 'innerHTML'){
                            item.setAttribute(k, v);
                        }
                    });
                    dropdown.appendChild(item);
                });

                if (!position) {
                    position = { top: 0, left: 0 };
                }
                dropdown.style.top = `${this.offsetTop + this.clientHeight + position.top}px`;
                dropdown.style.left = `${this.offsetLeft + position.left}px`;
            
                const fog = document.createElement('div');
                fog.id = 'fog';
                fog.classList.add('invisible');
            
                document.body.appendChild(fog);
                fog.appendChild(dropdown);
            
                fog.addEventListener('click', () => fog.remove());

                const items = dropdown.querySelectorAll('.item');
                items.forEach(b => b.addEventListener('click', () => clickFn(b)));

                return this;
            });
        }
    }
    
    // modal window
    class ModalWindow {
        constructor({ title, message, className }) {
            const fog = document.createElement('div');
            fog.id = 'fog';

            if (className){
                fog.classList.add(className);
            }

            fog.innerHTML = `<div class="modal">
                <h2>${title}</h2>
                <div id="content">${message}</div>
                <div id="button-container">
                    <button id="ok">OK</button>
                </div>
            </div>`;
            document.body.appendChild(fog);
            fog.addEventListener('click', () => fog.remove());
            fog.querySelector('.modal').addEventListener('click', e => e.preventDefault());
            fog.querySelector('#ok').addEventListener('click', () => fog.remove());

            return this;
        }
    }


    const gasTimer = {
        cards : [ // preferences for cards
            { name: '🛴Slow', accept: 35 },
            { name: '🚗Standard', accept: 60 },
            { name: '✈️Fast', accept: 90 },
            { name: '🚀Instant', accept: 100 },
        ],
    
        init: function() {
            const container = document.querySelector('#content #gas');
            container.innerHTML = '';
    
            this.cards.forEach(card => {
                const dom = `<div class="gas">
                    <div class="title">
                        <div class="left">${card.name}</div>
                    </div>
                    <div class="body">
                        <div class="gwei"><i class="fas fa-spin fa-cog"></i></div>
                        <div class="usd"></div>
                    </div>
                </div>`;
                container.insertAdjacentHTML('beforeend', dom);
            });

            container.classList.add('active');
        },
    
        update: async function() {
            this.beforeUpdate();

            let query = {
                apikey: apiKey,
                accept: this.cards.map(e => e.accept).join(','),
            };
    
            if (this.blocks){
                query.blocks = this.blocks;
            }
            if (this.percentile){
                query.percentile = this.percentile;
            }
    
            query = new URLSearchParams(query).toString();
            const data = await (await fetch(`https://owlracle.info/${network.get().symbol}/gas?${query}`)).json();
    
            if (data.error){
                console.log(data);
                new ModalWindow({
                    title: data.error,
                    message: `<p>${data.message}</p><p>Reopen this window and try again.</p>`,
                });
            }
            else{
                // console.log(data)
                this.onUpdate(data);
            }
            return data;    
        }
    };
    gasTimer.beforeUpdate = () => {
        document.querySelectorAll('.gas .body').forEach((e,i) => {
            e.querySelector('.gwei').innerHTML = `<i class="fas fa-spin fa-cog"></i>`;
            e.querySelector('.usd').innerHTML = ``;
        });
    }
    gasTimer.onUpdate = data => {
        const gas = data.speeds.map(s => s.gasPrice.toFixed(s.gasPrice == parseInt(s.gasPrice) ? 0 : 2));
        const fee = data.speeds.map(s => s.estimatedFee.toFixed(4));
    
        document.querySelectorAll('.gas .body').forEach((e,i) => {
            if (data.speeds){
                e.querySelector('.gwei').innerHTML = `${gas[i]} GWei`;
                e.querySelector('.usd').innerHTML = `$ ${fee[i]}`;
            }
        });
    };


    const networkSwitcher = {
        element: document.querySelector('#network-btn'),
        bound: false,

        reload: function() {
            if (!this.bound){
                this.bound = true;
                this.bindClick();
                gasTimer.init();
            }

            document.querySelector('#header #link').href = `https://owlracle.info/${network.get().symbol}`;

            this.element.removeAttribute('class');
            this.element.classList.add(network.get().symbol);
            this.element.querySelector('img').src = `https://owlracle.info/img/${network.get().symbol}.png`;
            this.element.querySelector('span').innerHTML = network.get().name;

            if (menu.getActive() == 'gas'){
                gasTimer.update();
            }
            if (menu.getActive() == 'chart'){
                chart.timeframeSwitch(60, '1h');
            }
        },

        get: function() {
            return this.element;
        },

        bindClick: function() {
            // network button action
            new Dropdown({
                button: this.element,
                itemList: Object.values(network.getList()).filter(e => e.symbol != network.get().symbol).map(e => { return { id: e.symbol, innerHTML: `<img class="icon" src="${e.icon.src}" alt="${e.name} icon"><span class="name">${e.name}</span>` }}),
                clickFn: e => {
                    network.set(e.id);
                    this.reload();
                },
            });
        }
    };


    const menu = {
        // set function for switching between menu buttons
        init: function() {
            document.querySelectorAll('#menu .item').forEach(e => e.addEventListener('click', () => this.setActive(e.id)));
        },

        // change dom css
        setActive: function(active) {
            this.active = active;

            document.querySelectorAll('#menu .item, #content .item').forEach(e => {
                e.classList.remove('active');
            });
    
            document.querySelector(`#content #${active}.item`).classList.add('active');
            document.querySelector(`#menu #${active}.item`).classList.add('active');
        },

        getActive: function() {
            return this.active;
        },

        setClick: function(active, fn) {
            document.querySelector(`#menu #${active}.item`).addEventListener('click', () => fn());
        },

        click: function(active) {
            document.querySelector(`#menu #${active}.item`).click();
        },
    }
    menu.init();

    // function for gas menu button
    menu.setClick('gas', () => networkSwitcher.reload());
    menu.setClick('chart', () => networkSwitcher.reload());
    menu.click('gas');


    // create price chart
    const chart = {
        ready: false,
        timeframe: 60,
        page: 1,
        candles: 1000,
        lastCandle: (new Date().getTime() / 1000).toFixed(0),
        allRead: false,
        network: network.get().symbol,
        mode: 'gas',
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

        init: async function() {
            document.querySelector('#content #chart.item').innerHTML = `
                <div class="row">
                    <div id="timeframe-switcher"><button></button></div>
                    <div id="style-switcher">
                        <button id="style-area" title="Change to Area Chart Style"><img src="https://owlracle.info/img/line-chart.png" alt="line chart symbol"></button>
                        <button id="style-candlestick" title="Change to Candlestick Chart Style"><img src="https://owlracle.info/img/candle-chart.png" alt="candlestick chart symbol"></button>
                    </div>
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
                height: 300,
                crosshair: {
                    mode: LightweightCharts.CrosshairMode.Normal,
                },
                timeScale: {
                    timeVisible: true,
                    secondsVisible: false,
                },
            });

            // copy object
            this.series = {
                gas: { config: Object.assign({}, this.config[this.preferences.gas]) },
                token: { config: Object.assign({}, this.config[this.preferences.token]) },
                fee: { config: Object.assign({}, this.config[this.preferences.fee]) },
            };
            
            // set modality buttons behaviour
            document.querySelectorAll(`#content #chart.item #toggle-container button`).forEach(e => e.addEventListener('click', async () => {
                if (e.classList.contains('active')){
                    return;
                }

                document.querySelectorAll(`#content #chart.item #toggle-container button`).forEach(a => {
                    const series = this.series[a.id];
                    if (a == e) {
                        a.classList.add('active');
                        series.visible = true;
                        this.mode = a.id;

                        // set candlestick or area button
                        document.querySelectorAll('#content #chart.item #style-switcher button').forEach(e => e.classList.remove('active'));
                        document.querySelector(`#content #chart.item #style-${series.config.style}`).classList.add('active');

                    }
                    else {
                        a.classList.remove('active');
                        series.visible = false;
                    }

                    if (series.series) {
                        series.series.applyOptions({ visible: series.visible });
                    }
                });
            }));

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
                    if (price && typeof price !== 'number'){
                        toolTip.innerHTML = Object.entries(price).map(([key, value]) => {
                            const name = key.charAt(0).toUpperCase() + key.slice(1);
                            
                            // trunc to max 4 decimal places
                            if (value.toString().split('.').length >= 2 && value.toString().split('.')[1].length > 4){
                                value = value.toString().split('.');
                                value = value[0] + '.' + value[1].slice(0,4);
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
                    { id: 'tf-10', innerHTML: '10 minutes' },
                    { id: 'tf-30', innerHTML: '30 minutes' },
                    { id: 'tf-60', innerHTML: '1 hour' },
                    { id: 'tf-120', innerHTML: '2 hours' },
                    { id: 'tf-240', innerHTML: '4 hours' },
                    { id: 'tf-1440', innerHTML: '1 day' },
                ],
                clickFn: b => chart.timeframeSwitch(b.id.split('tf-')[1], b.innerHTML.split(' ')[0] + b.innerHTML.split(' ')[1][0]),
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

                    if (newHistory.length == 0){
                        this.allRead = true;
                    }
                }
            });


            // set candle/area style buttons behaviour
            // document.querySelectorAll('#content #chart.item #style-switcher button').forEach(e => e.addEventListener('click', async () => {
            //     if (e.classList.contains('active')){
            //         return;
            //     }

            //     e.parentNode.querySelectorAll('button').forEach(e => e.classList.toggle('active'));
            //     const text = e.innerHTML;
            //     e.innerHTML = `<i class="fas fa-spin fa-cog"></i>`;

            //     const serie = this.series[this.mode];
            //     serie.config = Object.assign({}, this.config[e.id.split('style-')[1]]);
            //     const history = await this.getHistory(this.timeframe);

            //     this.obj.removeSeries(serie.series);
            //     serie.series = null;

            //     this.update(history);

            //     serie.series.applyOptions({ visible: serie.visible });

            //     e.innerHTML = text;

            //     this.setCookie();
            // }));


            this.ready = true;

            return;
        },

        timeframeSwitch: async function(time, text) {
            if (this.queryHistory){
                return;
            }

            const tfswitcher = document.querySelector('#content #chart.item #timeframe-switcher button');
            tfswitcher.innerHTML = `<i class="fas fa-spin fa-cog"></i>`;

            this.queryHistory = true;
            const history = await this.getHistory(time);
            tfswitcher.innerHTML = text;
            this.update(history);
            this.setCookie();
            this.queryHistory = false;

            document.querySelectorAll(`#toggle-container button`).forEach(b => {
                const series = this.series[b.id];
                if (series.visible){
                    series.series.applyOptions({
                        visible: series.visible
                    });
                }
            });
        },

        setCookie: function() {
            const cookieChart = Object.fromEntries(Object.entries(this.series).map(([k,v]) => [k, v.config.style]));
            cookieChart.timeframe = this.timeframe;
            cookies.set('chart', JSON.stringify(cookieChart), { expires: { days: 365 } });
        },

        update: function(data) {
            // console.log(data);
            if (data.length){
                const seriesName = { gas: 'gasPrice', token: 'tokenPrice', fee: 'txFee'};

                Object.entries(this.series).forEach(([key, value]) => {
                    const speedData = data.map(e => { 
                        if (value.config.style == 'candlestick'){
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
            
                    if (!value.series){
                        if (value.config.style == 'candlestick'){
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

        setTheme: function(name) {
            let background = '#232323';
            let text = '#e3dcd0';
            let lines = '#3c3c3c';

            if (name == 'light'){
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

        getHistory: async function(timeframe=60, page=1, candles=this.candles) {
            this.network = network.get().symbol;
            this.timeframe = timeframe;
            this.history = await (await fetch(`https://owlracle.info/${this.network}/history?apikey=${apiKey}&timeframe=${timeframe}&page=${page}&candles=${candles}&to=${this.lastCandle}&tokenprice=true&txfee=true`)).json();
            // console.log(this.history)
            if (this.history.error){
                console.log(this.history);

                if (this.history.error.status == 401){
                    return this.getHistory(timeframe, page, candles);
                }
                return [];
            }
            return this.history;
        },

        isReady: async function() {
            return this.ready || new Promise(resolve => setTimeout(() => resolve(this.isReady()), 10));
        }
    };

    // load chart preferences cookie
    if (cookies.get('chart')){
        let chartCookie = null;
        try {
            chartCookie = JSON.parse(cookies.get('chart'));
        }
        catch (error){
            console.log(error);
            cookies.delete('chart');
        }

        // test each individually to unsure loading only valid values
        if (chartCookie.gas){
            chart.preferences.gas = chartCookie.gas;
        }
        if (chartCookie.token){
            chart.preferences.token = chartCookie.token;
        }
        if (chartCookie.fee){
            chart.preferences.fee = chartCookie.fee;
        }
        if (chartCookie.timeframe){
            chart.timeframe = chartCookie.timeframe;
        }
    }

    chart.init().then( () => {
        chart.setTheme('dark');
        document.querySelector(`#content #chart.item #chart i`).remove();
    });


    // check if user is logged with an api key
    if (!cookies.get('apikey')){
        // new ModalWindow({
        //     title: `Welcome to Owlracle!`,
        //     message: `<p>Owlracle is a multichain gas price tracker. With Owlracle You can know the best gas price setting across seven chains with just a glance.</p><p>To better enjoy Owlracle it is reccomended that you use an api key. You can create one for free.</p>`,
        // });
    }
});