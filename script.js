var margin = {
    top: 20,
    right: 20,
    bottom: 30,
    left: 40
  },


// Define the canvas dimensions, so data is transformed to the canvas instead of the other way around.
  width = 1000 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;


// Define how the data (domain) needs to be transformed into a new interval (range)
var x = d3.scaleBand().range([0, width]).padding(0.1);
var y = d3.scaleLinear().range([height, 0]);


// create necessary variables 
var data = [];
var state = 0;
var currentCity = "";

// Init loads the first visualisation state. Number of hotels per city will be shown.
function init() {

  setEventListener();
  loadData();
}

// Create EventListers to make sure data can be modified when a button is pressed.
function setEventListener() {

  //Go back one state, when button is clicked.
  d3.select('.back-button').on('click', 
    function () 
    {
      console.log(state);
      if (state == 1)
      {
          reset();
          showCityData();
      }
      else if (state == 2)
      {
          reset();
          showStarData(currentCity);
      }
    }
  )
}

function reset() {

  // Kill the svg to make room for a new graph
  d3.select('section').selectAll('svg')
    .remove()
    .exit();

}


function loadData() {
  // Select textfile hotels.txt and store it's value in variable text. 
  // Callback function will transform the data and show the initial graph
  d3.text('hotels.txt').get(function(err,text)
  {
    // Prepare the loaded data to be usable in d3.js
    prepareData(err, text);

    // Initial graph, show the amount of hotels per city
    showCityData();
    });
}

// start formatting data (if 'text' can't be found -> throw error)
function prepareData(err, text) {

  if (err) throw err;

  // Because the dataset uses ';' instead of comma's, we can't use csv (comma separated values), but we have to use dsv (delimiter separated values).
  var parser = d3.dsvFormat(';');

  // var with parsed data 
  var parsed = parser.parse(text);

  // I will map the data to objects containing three elements: star, rooms, name. I will filter all the unnecessary elements from the dataset.
  // Make a var filled with all the wanted objects.
  var mapped = parsed  
    // Search for data with the matching conditions to be added to 'mapped'
    .filter(
        function (row)
        {
          // remove items that have an empty city
          if (row['plaats'].replace(/^\s+|\s+$/gm,'')=='')
            return false;
          else
            return true;
        }
      )
      .map(
        function (row) 
        {
          // runs for each value in the array and only returns the values stars rooms, name and city.
          return {
            stars: row['sterklasse NHC 2012'],
            rooms: row['aantal kamers in 2012'],
            name: row['hotel naam in 2012'],
            city: row['plaats']
          }
        }
      )

  // This is the data we're going to use for all graphs
  data = mapped;

  // Output to console to see if we're done it correctly
  console.log(data);
}

function titleCase(value) {
  return value.charAt(0).toUpperCase() + value.substr(1).toLowerCase();
}

function createGraph(dataGraph, graphTitle, tooltipLabel, xoffset, yoffset, rotation) {

  // Shows the data we're using for this graph on the console
  console.log(dataGraph);

  // Sort aray in place by key
  dataGraph.sort(function(a,b) {
    if (a.key<b.key)
      return -1;
    else if (a.key>b.key)
      return 1;
    else
      return 0;
  });

  // Scale the range of the data in the domains
  x.domain(dataGraph.map(function (d) {
    return d.key;
  }));

  // Scale the range of the y-as to the maximum value in the dataset
  y.domain([0, d3.max(dataGraph, function (d) {
    return d.value;
    // return (d.value>50?50:d.value);
  })]);

  // append the svg object to the body of the page
  var svg = d3.select("section").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", 800)
    // append a 'group' element to 'svg'
    .append("g")
    // moves the 'group' element to the top left margin
    .attr("transform",
      "translate(" + margin.left + "," + margin.top + ")");

  // Create the tooltip
  var tooltip = d3.select("section")
    .append("div")
    .attr("class", "tool-tip");

  // append the rectangles for the bar chart
  svg.selectAll(".bar")
    .data(dataGraph)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("x", function (d) {
      return x(d.key);
    })
    .attr("width", x.bandwidth())
    .attr("y", height)

    //Tool-tip
    .on("mouseover", function (d) {
      tooltip.text(tooltipLabel + ": " + d.value);
      tooltip.style("visibility", "visible");
    })
    // Determine which next graph to show on click
    .on("click", function(d) {
      if (state==0) {
        reset();
        showStarData(d.key)
        tooltip.remove();
      }
      else if (state==1) {
        reset();
        showHotelData(currentCity, d.key);
        tooltip.remove();
      }
    })
    //Folows cursor
    .on("mousemove", function () {
      return tooltip.style("top", (d3.event.pageY - 130) + "px").style("left", (d3.event.pageX - 20) + "px");
    })
    .on("mouseout", function () {
      return tooltip.style("visibility", "hidden");
    })
    //Intro transition
    .attr("height", 0)

    .transition()
    .duration(900)
    .attr("y", function (d) {
      return y(d.value);
    })
    .attr("height", function (d) {
      return height - y(d.value);
    })

  // add the x Axis
  svg.append("g")
    .attr('class', 'x-axis')
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate("+rotation+")")
    .attr("text-anchor", "start")
    .attr("x", xoffset)
    .attr("y", yoffset)
    .style("font-size", "1.1em")
    .style("text-transform", "lowercase")
    .style("fill", "white");

  // add the y Axis with ticks
  svg.append("g")
    .call(d3.axisLeft(y))
    .selectAll("text")
    .style("fill", "white");   

  // Set the title above the graph
  d3.select("#title")
    .text(graphTitle);
}

function showCityData() {

  // Set state and hide back button
  state = 0;
  d3.select(".back-button")
    .style("opacity", "0");

  // Group the data by city and count the number of hotels per city (rollup)
  var dataSteden = d3.nest()
    .key(function (d) {
      return d.city;
    })
    .rollup (function(v) {
      return v.length;
    })
    .entries(data);

  // Create the SVG and shows the graph
  createGraph(dataSteden, "Cities in the metropolitan region of Amsterdam", "Aantal hotels",10,3,60);
}

function showStarData(city) {

  // Set the current state, retain the current city and make the back buttons visible
  state = 1;
  currentCity = city;
  d3.select(".back-button")
  .style("opacity", "1");

  // Filter the data so only the data for the selected city remains
  var dataCity = data.filter(function(el) { 
    return (el.city == city);
  });

  // Group the data by city and count the number fo hotels per city (rollup)
  var dataStars = d3.nest()
    .key(function (d) {
      return d.stars;
    })
    .rollup (function(v) {
      return v.length;
    })
    .entries(dataCity);

  // Add the missing star numbers between 0 and 5
  var keys=dataStars.map(function(m) { return m.key; });
  for (var i=0; i<6; i++) {
    if (keys.indexOf(i.toString())==-1)
      dataStars.push({key: i.toString(), value: 0});
  }
  
  // Create the SVG and shows the graph
  createGraph(dataStars, "Star ratings of hotels in " + titleCase(city), "Aantal hotels",-3,10,0);
}

function showHotelData(city, stars) {
  
  // Set state and make button visible
  state = 2;
  d3.select(".back-button")
  .style("opacity", "1");

  // Filter the data so only the data for the selected city and stars remains
  var dataHotel = data.filter(function(el) { 
    return (el.city == city && el.stars == stars);
  });

  dataHotel = d3.nest()
    .key(function (d) {
      return d.name;
    })
    .entries(dataHotel)

    .map(function (group) {
      return {
        key: group.key,
        value: parseInt(group.values[0]["rooms"])
      };
    });

  // Create the SVG and shows the graph
  createGraph(dataHotel, stars+" star hotels in " + titleCase(city) + " with corresponding amount of rooms", "Kamers",10,3,60);
}

// Initialize app
init();