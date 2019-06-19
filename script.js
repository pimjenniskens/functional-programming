var margin = {
    top: 20,
    right: 20,
    bottom: 30,
    left: 40
  },

  width = 960 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;

// set the dimensions of the axis
var x = d3.scaleBand().range([0, width]).padding(.2);
var y = d3.scaleLinear().range([height, 0]);


var data = [];
var bedden;
var maxHotels = 10;

function init() {

  bedden = true;

  setEventListeners();
  loadData('beds', 10, "Aantal bedden:");
}

function setEventListeners() {

  //Change data on button trigger 'click'
  d3.select('.trigger-button').on('click', 
    function () 
    {
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
  //Select textfile hotels.txt and store it's value in variable text
  d3.text('hotels.txt').get(function(err,text)
  {
    applyData(err, text);
    showData(type, maxHotels, textLabel);
    });
}

// Utility function to return a kist of x random integers
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
    .filter(
      function (row)
      {
        currentHotel++;
        if (arr.indexOf(currentHotel) != -1) {
          return true;
        } else {
          return false;
        }
        // of dit: return (arr.indexOf(currentHotel)!=-1);
        // runs for each value in the array and only returns the values star & rooms.
      }
    )
    .map(
      function (row) 
      {

        return {
          stars: row['sterklasse NHC 2012'],
          rooms: row['aantal kamers in 2012'],
          name: row['hotel naam in 2012'],
          beds: row['aantal bedden in 2012']
        }
      }
    )

  // console.log(text);

  data = mapped;

  //Group the data by name and values
  data = d3.nest()
    .key(function (d) {
      return d.name;
    })
    .entries(data)

    .map(function (group) {
      return {
        id: group.key,
        values: group.values
      };
    });

  console.log(data);
}


function showData(type, maxHotels, textLabel) {

  //Variable with the index of the array with data
  var index = 0;

  // Scale the range of the data in the domains
  x.domain(data.map(function (d) {
    return d.values[index].name;
  }));
  // parseInt (+) changed string to int, so it becomes a number
  y.domain([0, d3.max(data, function (d) {

    return parseInt(d.values[index][type]);

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
    .data(data)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("x", function (d) {
      return x(d.values[index].name);
    })
    .attr("width", x.bandwidth())
    .attr("y", height)
    .attr("rx", 2)

    //Tool-tip
    .on("mouseover", function (d) {
      tooltip.text(textLabel + ":" + " " + d.values[index][type]);
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
      return y(d.values[index][type]);
    })
    .attr("height", function (d) {
      return height - y(d.values[index][type]);
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