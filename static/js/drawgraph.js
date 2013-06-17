$(function() {    
  var cancel = false;
  $("#error").hide() // hide the error div unless it's needed
  // Callback function when the getJSON call returns, draws the svg.
  var callback = function(data) {	
    
    // Add some error handling
    var errmsg;
    if(data.error) {
      if(data.error === "parse error") {
	errmsg = "Sorry, couldn't parse that"
      } else if(data.error === "evalf error") {
	errmsg = "Error while evaluating, probably a complex result."
      } else if(data.error === "invalid range") {
	errmsg = "invalid range!"
      }
      $("#error").text(errmsg)
	.fadeIn(400)
	.delay(400)
	.fadeOut(400);
      cancel = false; // So the next plot works
      return;
    }

    // Clear the previous plot
    d3.select("body").select("svg").remove();
    
    // Parameters for the svg canvas
    var swidth = 600;
    var sheight = 500;

    var margin = {top: 80, right: 80, bottom: 80, left: 80};
    var width = swidth - margin.left - margin.right;
    var height = sheight - margin.top - margin.bottom;

    // Make an svg to draw the plot on
    d3.select("body").append("svg")
      .attr("width",swidth)
      .attr("height",sheight)
      .append("svg:g")
      .attr("id","plot")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    // Less verbose
    var points = data.points
    
    // Scales
    var xsc = d3.scale.linear()
      .domain([data.xmin,data.xmax])
      .range([0,width]);

    var ysc = d3.scale.linear()
      .domain([d3.min(_.pluck(points,1)),d3.max(_.pluck(points,1))])
      .range([height,0]); // These are inverted because (0,0) is svg top right

    //Axes
    var xAxis = d3.svg.axis()
      .scale(xsc)
      .orient("bottom")
      .ticks(5)

    var yAxis = d3.svg.axis()
      .scale(ysc)
      .orient("left")
      .ticks(5);

    // Function to generate svg line from data
    var lineFunction = d3.svg.line()
      .x(function(d) { return xsc(d[0]); })
      .y(function(d) { return ysc(d[1]); })
      .interpolate("linear");

    var svg = d3.select("g#plot");

    // Actually draw the graph
    svg.append("svg:path")
      .attr("d",lineFunction(points))
      .attr("class","line");

    // Add axes
    svg.append("svg:g")
      .attr("transform","translate(0," + height + ")")
      .attr("class","x axis")
      .call(xAxis);

    svg.append("svg:g")
      .attr("class","y axis")
      .call(yAxis);

    // Bind the sampler data to a circle
    var i = 0 // The index we are at in the sampler data

    // Less verbose
    var chain = data.chain;

    // Initialize the circle
    var circles = svg.selectAll("circle")
      .data(chain.slice(0,1))
    .enter().append("circle")
      .attr("cy",height)
      .attr("cx",function(x) {
	return xsc(x);
      })
      .attr("r",10);
    
    i++;
    // console.log(circles);
    // console.log(data.chain);    

    var update = function() {
      if(cancel === false && i < chain.length){
	console.log(i);
	circles.data(chain.slice(i,i+1))
	  .transition()
	  .attr("cx",
		function(x) {
		  return xsc(x);
		});
	i++;
	setTimeout(update,500);
	} else {
	  cancel = false;
	  return;
	} 
    };
    update();
  };

  // Function to be called when the user submits 
  var submit_func = function() {
    if($("svg").length > 0) { 
      // if there is already an svg drawn, cancel the previous updater 
      cancel = true;
    }

    $.getJSON($SCRIPT_ROOT + '/drawgraph',
	      /* The address to which we will send the request. */
	      {eq: $('input[name="equation"]').val(),
               minx: $('input[name="minx"]').val(),
               maxx: $('input[name="maxx"]').val()}, 
	      /* The JS object that flask will build the request out of. */ 
	      callback /* Callback function. */);
    return false;
  };

  //Bind clicking and keydown to submit the data to the server
  $('a#submit').click(submit_func);
  
  $('input').keydown(
    function (e) {
      if (e.keyCode === 13) {
	submit_func();
      }
    })
});
