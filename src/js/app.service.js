(function() {
    'use strict';

    angular
        .module('app')
        .service('AppService', AppService);

    AppService.$inject = ['$rootScope'];

    function AppService($rootScope) {
        var CONST = { /* Helpful constants */
            COLORS: ['#CFD8DC', '#90A4AE', '#607D8B', '#455A64', '#263238'],
            COUNTRY_CODES: null,
            LABELS: ['0 or no data', '1 - 5', '16 - 30', '31 - 100', '100+'],
            RANGES: [[1,5], [6,15], [16,30], [31,100]] // Workaround: false logarythmic scale. ToDo: change it to true log.
        };
        var data = { /* Here will be all app data */
            isNobelWinnersLoaded: false,
            isWorldMapLoaded: false,
            all: [],
            categories: ['chemistry', 'economics', 'literature', 'medicine', 'peace', 'physics'],
            chemistry: [],
            economics: [],
            geo: {countries: null, meta: null},
            literature: [],
            medicine: [],
            peace: [],
            physics: [],
            total: [],
            winners: null,
            winnersPerCountry: {},
            year: []
        };
        var shared = { /* Data shared with Controller */
            header: null,
            isAppReady: false,
            range: {min: 0, max: 100},
            value: {min: 0, max: 100},
            winners: null
        };
        var bx, cx; /* Scale functions */

        this.exports = shared;
        this.initialize = initialize;
        this.setYearsRange = setYearsRange;

        function initialize () { /* Initialize: fetch data -> build charts */
            d3.csv("assets/data/NobelPrizesPerYear.csv", function(error, success) {
                if (error) throw error;
                success.map(function (d) { /* Map data */
                    data.chemistry.push(parseInt(d.chemistry));
                    data.economics.push(parseInt(d.economics));
                    data.literature.push(parseInt(d.literature));
                    data.medicine.push(parseInt(d.medicine));
                    data.peace.push(parseInt(d.peace));
                    data.physics.push(parseInt(d.physics));
                    data.total.push(parseInt(d.total));
                    data.year.push(parseInt(d.year));
                });
                var min = d3.min(data.year), max = d3.max(data.year);
                $rootScope.$apply(function(){ /* Update slider model */
                    shared.range.min = min;
                    shared.range.max = max;
                    shared.value.min = min;
                    shared.value.max = max;
                });
                _buildColumnChart(data);
                _buildBarChart(data);
            });
            d3.json('assets/data/World.json', function(error, success) {
                if (error) throw error;
                CONST.COUNTRY_CODES = success.countries.map(function(country){ return country.id; });
                data.geo.countries = success.countries;
                data.geo.meta = success.meta;
                data.isWorldMapLoaded = true;
                _buildGeoChart();
            });
            d3.csv('assets/data/NobelPrizeWinners.csv', function(error, success) {
                if (error) throw error;
                data.winners = success;
                data.isNobelWinnersLoaded = true;
                _buildGeoChart();
            });
        }
        /*Range-slider for Viz 1: Nobel prize winners per year*/
        function setYearsRange () { /* Update view on changed years interval */
            var minIndex = data.year.indexOf(shared.value.min), maxIndex = data.year.indexOf(shared.value.max);
            /* Update column chart */
            d3.select('#column-chart').selectAll('div').attr('data-active', function(d, i) { return !(i < minIndex || i > maxIndex) });
            /* Update bar chart */
            data.categories.forEach(function (item, index) {
                data.all[index] = data[item].slice(minIndex, maxIndex + 1).reduce(function (a,b) { return a + b; }, 0);
            });
            d3.select('#bar-chart').selectAll('div').data(data.all).style('width', function(d) { return bx(d) + '%'; }).text(function (d) { return d; });
            d3.select('#bar-chart').selectAll('div').data(data.categories).append('label').attr('class', 'label').text(function (d) { return d; });
            /* Update geo chart */
            data.winnersPerCountry = {};
            data.winners.forEach(function(winner){ /* create Nobel Winners Per Country List */
                var year = parseInt(winner.year);
                if (year < shared.value.min || year > shared.value.max) return;

                if (data.winnersPerCountry.hasOwnProperty(winner.countryCode)) {
                    data.winnersPerCountry[winner.countryCode]++;
                } else {
                    data.winnersPerCountry[winner.countryCode] = 1;
                }
            });
            d3.select('#geo-chart').selectAll('path').data(data.geo.countries).style('fill', function(d) {return __numberToColor(data.winnersPerCountry[d.id]);});
        }

        /*Function for building Viz 2: Nobel prize winners per category*/
        function _buildBarChart (data) { /* Function to build bar chart / categories */
            data.categories.forEach(function (item) {
                data.all.push( data[item].reduce(function (a,b) { return a + b; }, 0) );
            });
            bx = d3.scale.linear()
                .domain([0, d3.max(data.all)])
                .range([0, 100]);
            d3.select('#bar-chart')
                .selectAll('div')
                .data(data.all)
                .enter()
                .append('div')
                .attr('class', 'category')
                .attr('title', function(d, i) { return data.categories[i]; })
                .style('width', function(d) { return bx(d) + '%';})
                .text(function (d) { return d; })
                .on('click', function (d,i) { _onCategoryClick(i); });
            d3.select('#bar-chart')
                .selectAll('div')
                .data(data.categories)
                .append('label')
                .attr('class', 'label')
                .text(function (d) { return d; });
            var width = $('#bar-chart').width();
            var x = d3.scale.linear()
                .domain([0, d3.max(data.all)])
                .range([0, width]);
            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("down")
                .ticks(5);
            d3.select('#bar-chart')
                .append('svg')
                .attr("width", width)
                .attr("height", 30)
                .attr("class", "x-axis-container")
                .append("g")
                .attr("class", "x-axis")
                .call(xAxis)
                .selectAll("text")
                .style("text-anchor", "start");

        }

        /*Function for building Viz 1: Nobel prize winners per year*/
        function _buildColumnChart (data) { /* Function to build column chart / years */
            cx = d3.scale.linear()
                .domain([0, d3.max(data.total)])
                .range([0, 100]);
            d3.select('#column-chart')
                .selectAll('div')
                .data(data.total)
                .enter()
                .append('div')
                .attr('title', function(d) { return 'Nobel prize winners: ' + d; })
                .attr('data-active', true)
                .style('height', function(d) {return cx(d) + 'px';})
                .on('click', function (d,i) { _onYearClick(i); });
            var width = $('#column-chart').width(), height = $('#column-chart').height();
            var x = d3.scale.linear()
                .domain([data.year[0], data.year[data.year.length-1]]) //[data.year[0], data.year[data.year.length-1]]
                .range([0, width]);
            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("down")
                .ticks(10)
                .tickFormat(d3.format("d"));
            d3.select('#column-chart')
                .append('svg')
                .attr("width", width)
                .attr("height", 30)
                .attr("class", "x-axis-container")
                .append("g")
                .attr("width", width)
                .attr("class", "x-axis")
                .call(xAxis)
                .selectAll("text")
                .attr('test', function (d) {console.log(d);})
                .style("text-anchor", "start");
            var y = d3.scale.linear()
                .domain([d3.max(data.total), 0])
                .range([0, 100]);
            var yAxis = d3.svg.axis()
                .scale(y)
                .orient("left")
                .ticks(4);
            d3.select('#column-chart')
                .append('svg')
                .attr("width", 1)
                .attr("height", height)
                .attr("class", "y-axis-container")
                .append("g")
                .attr("class", "y-axis")
                .call(yAxis);
        }

        /*Functions for building Viz 2: Nobel prize winners per country*/
        function _buildGeoChart () { /* Function to build geo chart / countries */
            if (!data.isWorldMapLoaded || !data.isNobelWinnersLoaded) return; /* All data ready */
            $rootScope.$apply(function(){ /* update data for app controller */
                shared.isAppReady = true;
            });
            data.winners.forEach(function(winner){ /* create Nobel Winners Per Country List */
                if (data.winnersPerCountry.hasOwnProperty(winner.countryCode)) {
                    data.winnersPerCountry[winner.countryCode]++;
                } else {
                    data.winnersPerCountry[winner.countryCode] = 1;
                }
            });
            /* Build geo chart */
            var width = $('#geo-chart').width(),
                height = width / parseInt(data.geo.meta.width) * parseInt(data.geo.meta.height);
            d3.select('#geo-chart')
                .append('svg')
                .attr('width', width)
                .attr('height', height)
                .style('background-color', '#B3E5FC')
                .attr('viewBox', '0 0 ' + data.geo.meta.width + ' ' + data.geo.meta.height)
                .append('g')
                .selectAll('path')
                .data(data.geo.countries)
                .enter()
                .append('path')
                .attr('id', function(d) { return d.id; })
                .attr('title', function(d) { return d.title; })
                .attr('class', function(d) { return d.class; })
                .style('fill', function(d) {return __numberToColor(data.winnersPerCountry[d.id]);})
                .attr('d', function(d) { return d.d; })
                .on('click', function (d,i) { _onCountryClick(d); });
            d3.select('#geo-chart')
                .selectAll('path')
                .data(data.geo.countries)
                .append('title')
                .text(function (d) { return d.title; });
            /* create legend for chart */
            d3.select('#geo-chart')
                .append('div')
                .attr("class", "legend-container")
                .selectAll('span')
                .data(CONST.LABELS)
                .enter()
                .append('span')
                .attr('class', 'legend-tick')
                .style('background-color', function(d, i) { return i==0 ? '#FFFFFF' : CONST.COLORS[i]; })
                .text(function (d,i) { return CONST.LABELS[i]; })
        }

        /*Handler function for click event for Viz 2: Nobel prize winners per category, shows them in sidebar */
        function _onCategoryClick (i) { /* click on category */
            var targetCategory = data.categories[i];
            $rootScope.$apply(function () {
                shared.header = 'Nobel prize winners of ' + targetCategory;
                shared.winners = data.winners.filter(function(winner){
                    var year = parseInt(winner.year);
                    return year >= shared.value.min && year <= shared.value.max && winner.category == targetCategory;
                });
            });
        }

        /*Handler function for click event for Viz 3: Nobel prize winners per country, shows them in sidebar */
        function _onCountryClick (d) { /* click on country */
            var targetCountry = d.id;
            $rootScope.$apply(function () {
                shared.header = 'Nobel prize winners of ' + d.title;
                shared.winners = data.winners.filter(function(winner){
                    var year = parseInt(winner.year);
                    return year >= shared.value.min && year <= shared.value.max && winner.countryCode == targetCountry;
                });
            });
        }

        /*Handler function for click event for Viz 1: Nobel prize winners per year, shows them in sidebar */
        function _onYearClick (i) { /* click on year */
            var targetYear = data.year[i];

            $rootScope.$apply(function () {
                shared.header = 'Nobel prize winners of ' + targetYear;
                shared.winners = data.winners.filter(function(winner){

                    return winner.year == targetYear;
                });
            });
        }

        /*Converts numbers of winners to hex colour*/
        function __numberToColor (number) { /* find number in range, assign color */
            if (!number || number === 0) return;

            for(var len = CONST.RANGES.length, i = 0; i < len; i++) {
                if (number >= CONST.RANGES[i][0] && number <= CONST.RANGES[i][1]) {
                    return CONST.COLORS[i];
                }
            }
            return CONST.COLORS[CONST.COLORS.length - 1];
        }
    }
})();