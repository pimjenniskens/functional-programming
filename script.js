var margin = {
    top: 20,
    right: 20,
    bottom: 30,
    left: 40
  },


// Define the canvas dimensions, so data is transformed to the canvas instead of the other way around.
  width = 960 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;


// Define how the data (domain) needs to be transformed into a new interval (range)
var x = d3.scaleBand().range([0, width]).padding(.4);
var y = d3.scaleLinear().range([height, 0]);


// create necessary variables 
var data = [];
var dataSteden = [];
var dataHotels = [];
var dataSterrenBedden = [];

var bedden;
var maxHotels = 10;


// Init loads the first visualisation state. 'Bedden' will be shown.
function init() {

  bedden = true;

  setEventListeners();
  loadData('beds', 10, "Aantal bedden:");
}

// Create EventListers to make sure data can be modified when a button is pressed.
function setEventListeners() {

  //Change data on button trigger 'click'
  d3.select('.trigger-button').on('click', 
    function () 
    {

      // Remove and exit the current data in the svg
      reset();

      if (bedden == true)
      {
        showData('stars', 10, "Aantal sterren");
        bedden = false;
        document.getElementById("button-label").innerHTML = "Beds";
      } 
      else 
      {
        showData('beds', 10, "Aantal bedden:");
        bedden = true;
        document.getElementById("button-label").innerHTML = "Stars";
      }
    }
  )

  // Reload page -> show 10 random hotels
  document.getElementById("button-refresh").addEventListener("click", 
    function ()
    {
      window.location.reload();
    }
  );

}

function reset() {

  d3.select('section').selectAll('svg')
    .remove()
    .exit();

}


function loadData(type, maxHotels, textLabel) {
  //Select textfile hotels.txt and store it's value in variable text. applyData() to make the text readable and showData() to fill the initial svg with the cleaned data.
  d3.text('hotels.txt').get(function(err,text)
  {
    applyData(err, text);
    showData(type, maxHotels, textLabel);
    });
}

// Utility function to return a list of x random integers
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function getRandomInts(parsed, num) {
  var ints = [];
  while (ints.length < num) {
    var randNum = getRandomInt(1, parsed.length);
    if (ints.indexOf(randNum) == -1 && parsed[randNum-1].nummer!='') {
      ints.push(randNum);
    }
  }
  return ints;
}

// start formatting data (if 'text' can't be found -> throw error)
function applyData(err, text) {

  if (err) throw err;

  // Because de dataset uses ';' instead of comma's, we can't use csv (comma separated values), but we have to use dsv (delimiter separated values).
  var parser = d3.dsvFormat(';');

  // var met parsed data obv parser. 
  var parsed = parser.parse(text);

  var arr = getRandomInts(parsed, 10);
  console.log(arr);

  // start counting @
  var currentHotel = 0;

  // I will map the data to objects containing three elements: star, rooms, name. I will filter all the unnecessary elements from the dataset.
  // Make a var filled with all the wanted objects.
  var mapped = parsed
  
  // Search for data with the matching conditions to be added to 'mapped'
  .filter(
      function (row)
      {
        if (row['plaats'].replace(/^\s+|\s+$/gm,'')=='')
          return false;
        else
          return true;

/*        return (row['plaats']!='');
          return !(row['plaats']=='');
          currentHotel++;
        
        // Find out if the current row is corresponding with the numbers defined in var arr. 
        if (arr.indexOf(currentHotel) != -1) {
          return true;
        } else {
          return false;
        }
        // of dit: return (arr.indexOf(currentHotel)!=-1);
  */    
      }
    )
    .map(
      function (row) 
      {
    // runs for each value in the array and only returns the values stars rooms, name and beds.
        return {
          stars: row['sterklasse NHC 2012'],
          rooms: row['aantal kamers in 2012'],
          name: row['hotel naam in 2012'],
          beds: row['aantal bedden in 2012'],
          plaats: row['plaats']
        }
      }
    )

  // console.log(text);

  data = mapped;

/*    .map(function (group) {
      return {
        id: group.key,
        values: group.values
      };
    })
 */

  console.log(data);
}


function showData(type, maxHotels, textLabel) {

  // Summarize the number of hotels per city
  // [ { key: "PLAATS", value: aantal} ]
  var dataSteden = d3.nest()
    .key(function (d) {
      return d.plaats;
    })
    .rollup (function(v) {
      return v.length;
    })
    .entries(data);

  dataSteden.sort(function(a,b) {
    if (a.key<b.key)
      return -1;
    else if (a.key>b.key)
      return 1;
    else
      return 0;
  });
  
  console.log(dataSteden);

  // Scale the range of the data in the domains
  x.domain(dataSteden.map(function (d) {
    return d.key;
  }));
  // parseInt (+) changed string to int, so it becomes a number
  y.domain([0, d3.max(dataSteden, function (d) {

    return parseInt(d.value);

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

  var tooltip = d3.select("section")
    .append("div")
    .attr("class", "tool-tip");


  // append the rectangles for the bar chart
  svg.selectAll(".bar")
    .data(dataSteden)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("x", function (d) {
      return x(d.key);
    })
    .attr("width", x.bandwidth())
    .attr("y", height)
    .attr("rx", 2)

    //Tool-tip
    .on("mouseover", function (d) {
      tooltip.text(" Aantal hotels:" + " " + d.value);
      tooltip.style("visibility", "visible");
    })
    //Folows cursor
    .on("mousemove", function () {
      return tooltip.style("top", (d3.event.pageY - 20) + "px").style("left", (d3.event.pageX + 20) + "px");
    })
    .on("mouseout", function () {
      return tooltip.style("visibility", "hidden");
    })
    //Intro transition
    .attr("height", 0)

    .transition()
    .duration(500)
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
    .attr("transform", "rotate(60)")
    .attr("text-anchor", "start");

  // add the y Axis with ticks amount of rooms
  svg.append("g")
    .call(d3.axisLeft(y));
}


// Initialize app
init();