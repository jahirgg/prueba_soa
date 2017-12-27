/* Global Variables */
var gMinY, gMaxY;
var gDataset;

// This array is used for table titles in the drawTransactions method
var replacementsTxn = [
  ["num", "Transacción"],
  ["fecha", "Fecha"],
  ["id_cliente", "Cliente"],
  ["txn", "Monto"]
];

// This array is used for table titles in the drawNetCashflow method
var replacementsCashFlow = [  
  ["fecha", "Fecha"],
  ["id_cliente", "Cliente"],
  ["neto", "Monto"]
];

// Time formatter for date in YYYY-mm-dd format
var format = d3.time.format("%Y-%m-%d");

/* Run Once Methods: These will run at page load */

// Hiding the moving average alert the first time the page loads
hideAlert();

/* Enabling the checkbox behaviour so that it can trigger the
* change between the Client Transactions visualization and the
* Net Cashflow visualization.
*/
d3.select(".check")
    .on("change", function(){
      var isChecked = d3.select(".check")[0][0].checked;
      removeElements();
      if (isChecked){
        //Draw Net Cashflow graph
        drawNetCashflow(document.getElementById("myVal").value)   
      }else{
        //Draw Transaction Details
        drawTransactions(document.getElementById("myVal").value)
      }
    });

/* Function Declarations */

/** 
 * Hides moving average alert.
 * This method looks for the element
 * with the .alert class and disables
 * it's visibility.
 */
function hideAlert(){
  alert = d3.select(".alert")
          .style("visibility","hidden");
}

/**
 * Shows the moving average alert
 * This method looks for the element
 * with the .alert class and enables
 * it's visibility.
 */
function showAlert(){
  alert = d3.select(".alert")
          .style("visibility","visible");
}

/**
 * This function uses jQuery to find the elements elements
 * within the table header and changes the column names from
 * their database representation to a more understandable name.
 * @param {*} replacements Array with new header names.
 */
function runReplaceHeaders(replacements) {
  $("table th").each(function() {
    var $this = $(this);
    var ih = $this.html();
    $.each(replacements, function(i, arr) {
      ih = ih.replace(arr[0], arr[1]);
    });
    $this.html(ih);
  });
}

/**
 * This function declares the Y Axis 
 * @param {*} y D2 Scale element
 */
function make_y_axis(y) {        
  return d3.svg.axis()
      .scale(y)
      .orient("left")
      .ticks(1)
}

/**
 * This function gives format to currency values
 * @param {*} n Double with the value to format
 */
function dollarFormatter(n) {
  n = Math.round(n);
  var result = n;
  if (Math.abs(n) > 1000) {
    result = Math.round(n/1000) + 'K';
  }
  return '$' + result;
}

/**
 * This method cleans the visualization elements
 * from the page using d3.
 */
function removeElements(){
  d3.select("svg").remove()
  d3.select(".tooltip").remove()    
  d3.select(".chart_container").append("svg").attr("class","chart")
  d3.select(".transaction_list").remove()
  hideAlert()
}

/**
 * This method gets called once the user completes typing the client's id
 * and either presses <enter> or click the <Buscar Cliente> button
 * @param {*} event 
 */
function handleClick(event){
  //Fisrt removing any svg elements on the page
  removeElements(); 
  //Resetting the checkbos to "Not Checked"
  d3.select(".check").property("checked",false)
  //Calling the method to draw the transaction with the client id parameter
  drawTransactions(document.getElementById("myVal").value)
  return false;
} 

/**
 * This function verifies if the NetCashflow is being shown and
 * in that case calls the method to calculate and draw the
 * moving average
 */
function showMovingAverage(){
  var isChecked = d3.select(".check")[0][0].checked;
  if (isChecked){
    d3.select("sma").remove;
    drawMovingAverage(document.getElementById("myVal").value)
  }
}

/**
 * This method calls the ClientView API and draws the visualization and
 * transaction list (table) with all transactions.
 * @param {*} id_cliente String value of the client id to call with the API
 */
function drawTransactions(id_cliente){

  // Asynchronous call to read the client's transaction and return it in JSON format
  // As the call is asyn, all necesary drawing elements are declared inside to enable
  // the drawing only once the data is fetched.
  d3.json('http://127.0.0.1:8000/api/client/'+id_cliente+'.json', function (error,data) {

    data.forEach(function(d) {
      //Ensuring numeric values for num and fecha
      d.num = +d.num; 
      d.txn = +d.txn; 
    });   

    /**
     * Function to draw the transaction list table
     * @param {*} data Array with the downloaded data 
     * @param {*} columns Names of the columns to use within the data
     */
    function tabulate(data, columns) {

          // Selecting the table elements on the page
          var table = d3.select(".services").append('table').attr("class","transaction_list")
          var thead = table.append('thead').attr("align","center")
          var	tbody = table.append('tbody');
  
          // append the header row using the <columns> passed as parameters
          thead.append('tr')
            .selectAll('th')
            .data(columns).enter()
            .append('th')
              .text(function (column) { return column; });
  
          // create a row for each object in the data
          var rows = tbody.selectAll('tr')
            .data(data)
            .enter()
            .append('tr');
  
          // create a cell in each row for each column
          var cells = rows.selectAll('td')
            .data(function (row) {
              return columns.map(function (column) {
                return {column: column, value: row[column]};
              });
            })
            .enter()
            .append('td')
              .text(function (d) { return d.value; });
  
        return table;
      }  

      /**
       * Function to create the visualization for the transaction list.
       * @param {*} data Array with all client's transactions
       */
      function waterfall(data){
        // Creating the time formmaters
        var formatChartDate = d3.time.format("%Y-%m-%d").parse;
        var formatDate = d3.time.format("%e-%b-%y");

        // Defining the margin and SVG element dimensions
        var margin = {top: 20, right: 30, bottom: 60, left: 40},
            width = 900 - margin.left - margin.right,
            height = 475 - margin.top - margin.bottom,
            padding = 0.3;
        
        // Defining scale elements
        var x = d3.scale.ordinal()
            .rangeRoundBands([0, width], padding);
        
        var y = d3.scale.linear()
            .range([height, 0]);
        
        // Defining the axis
        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");
        
        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .tickSize(-width, 0, 0)
            .tickFormat(function(d) { return dollarFormatter(d); });
        
        // Selecting the <.chart> element with is an <svg> type
        var chart = d3.select(".chart")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .attr("align","center")
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


        // Define the div for the tooltip
        var div = d3.select("body").append("div")	
            .attr("class", "tooltip")				
            .style("opacity", 0);    

        // Transform data (i.e., finding cumulative values and total) for easier charting
        var cumulative = 0;
        var yMax = 0, yMin = 0;

        /* Here some data transformation and cleaning is performed.
           This is to calculate the cumulative value, where each bar
           will appear on screen and where it will end.
        */
        for (var i = 0; i < data.length; i++) {
          data[i].name = i; 
          data[i].value = +data[i].txn; 
          data[i].txn = +data[i].txn;
          data[i].start = cumulative;
          cumulative += data[i].value;
          data[i].end = cumulative;
          yMax = Math.max(yMax, cumulative);
          yMin = Math.min(yMin, cumulative);
          // Asigning a class for coloring the bars the right color
          data[i].class = ( data[i].value >= 0 ) ? 'positive' : 'negative'
        }
        /* //Option to show a total on the last column
        data.push({
          name: 'Total',
          end: cumulative,
          start: 0,
          class: 'total'
        });
        */

        //Mapping the x axis to the name variable. This variables contains the array index values
        x.domain(data.map(function(d) { return d.name; }));

        // Determining the min and max value on the y axis and ensuring the cero on the y axis is always shown.
        min = d3.min(data, function(d) {return d.end;});
        if (min > 0)
          min = 0;
        max = d3.max(data, function(d) { return d.end; })
        if (max < 0)
          max = 0

        // Mapping the y axis to the min and max values with 7% padding on each side.  
        y.domain([min*1.07,max*1.07]);

        chart.append("g")
          .attr("class", "xaxis")
          .attr("transform", "translate(0," + height + ")")
          .call(xAxis)
          .selectAll("text")
          .attr("dx", "-.8em")
          .attr("dy", "-.55em")
          .attr("transform", "rotate(-90)")
          .style("text-anchor", "end");;

        chart.append("g")
          .attr("class", "yaxis")      
          .call(yAxis);
            
        chart.append("g")         
          .attr("class", "origin")
          .call(make_y_axis(y)
              .tickSize(-width, 0, 0)
              .tickFormat("")
          )
          
        // Defining the bars
        var bar = chart.selectAll(".bar")
            .data(data)
          .enter().append("g")
            .attr("class", function(d) { return "bar " + d.class })
            .attr("transform", function(d) { return "translate(" + x(d.name) + ",0)"; })
            .on("mouseover", function(d) {	
                  // When the mouse hovers over the bar the <div> will
                  // show in the mouse position.	
                  div.transition()		
                      .duration(200)		
                      .style("opacity", .9);		
                  div	.html(d.fecha + "<br/>"  + "$" +d.value)	
                      .style("left", (d3.event.pageX) + "px")		
                      .style("top", (d3.event.pageY - 28) + "px");	
                  })					
              .on("mouseout", function(d) {	
                  // On mouse out, the <div> with the tool tip will fade away.	
                  div.transition()		
                      .duration(500)		
                      .style("opacity", 0);	
              });

        // Adding each rectangle
        bar.append("rect")
          .attr("y", function(d) { return y( Math.max(d.start, d.end) ); })
          .attr("height", function(d) { return Math.abs( y(d.start) - y(d.end) ); })
          .attr("width", x.rangeBand());
          
        /* //Optional line use to show in line value on bars
           //Chosed not to use it but the code is usefull as a reference
        bar.append("text")
            .attr("x", x.rangeBand() / 2)
            .attr("y", function(d) { return y(d.end) + 5; })
            .attr("dy", function(d) { return ((d.class=='negative') ? '-' : '') + ".75em" })
            .text(function(d) { return dollarFormatter(d.end - d.start);});
        */
        bar.filter(function(d) { return d.class != "total" }).append("line")
            .attr("class", "connector")
            .attr("x1", x.rangeBand() + 5 )
            .attr("y1", function(d) { return y(d.end) } )
            .attr("x2", x.rangeBand() / ( 1 - padding) - 5 )
            .attr("y2", function(d) { return y(d.end) } )

            
        // Changing the X Axis label to the respective dates instead of array index (jQuery)
        var items = $(".xaxis text");
        items.each(function (i){          
          $(this).text(formatDate(formatChartDate(data[i].fecha)));
        });
      }

      // Calling the waterfall visualization method
      waterfall(data);
      // Calling the table drawing method
      tabulate(data, ['num', 'fecha', 'id_cliente', 'txn']); 
  
      // Changing the names of the columns
      runReplaceHeaders(replacementsTxn); 
  });
}

function drawNetCashflow(id_cliente){
  // Asynchronous call to the NetCashflow API
  d3.json('http://127.0.0.1:8000/api/client/net/'+id_cliente+'.json', function (error,data) {

    data.forEach(function(d) {
      // Ensuring numeric values
      d.num = +d.num;
      d.neto = +d.neto;
    });   

    // Drawing the table with transactions
    function tabulate(data, columns) {
          var table = d3.select(".services").append('table').attr("class","transaction_list")
          var thead = table.append('thead').attr("align","center")
          var	tbody = table.append('tbody');
  
          // append the header row
          thead.append('tr')
            .selectAll('th')
            .data(columns).enter()
            .append('th')
              .text(function (column) { return column; });
  
          // create a row for each object in the data
          var rows = tbody.selectAll('tr')
            .data(data)
            .enter()
            .append('tr');
  
          // create a cell in each row for each column
          var cells = rows.selectAll('td')
            .data(function (row) {
              return columns.map(function (column) {
                return {column: column, value: row[column]};
              });
            })
            .enter()
            .append('td')
              .text(function (d) { return d.value; });
  
        return table;
      }  

      //Drawing the waterfall bar chart
      function waterfall(data){
        var formatChartDate = d3.time.format("%Y-%m-%d").parse;
        var formatDate = d3.time.format("%e-%b-%y");
        
        var margin = {top: 20, right: 30, bottom: 60, left: 40},
            width = 900 - margin.left - margin.right,
            height = 475 - margin.top - margin.bottom,
            padding = 0.3;
        
        var x = d3.scale.ordinal()
            .rangeRoundBands([0, width], padding);
        
        var y = d3.scale.linear()
            .range([height, 0]);
        
        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");
        
        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .tickSize(-width, 0, 0)
            .tickFormat(function(d) { return dollarFormatter(d); });
        
        
        var chart = d3.select(".chart")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .attr("align","center")
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


        // Define the div for the tooltip
        var div = d3.select("body").append("div")	
            .attr("class", "tooltip")				
            .style("opacity", 0);    

        // Transform data (i.e., finding cumulative values and total) for easier charting
        var cumulative = 0;
        var yMax = 0, yMin = 0;
        for (var i = 0; i < data.length; i++) {
          data[i].name = i; 
          data[i].value = +data[i].neto; 
          data[i].txn = +data[i].neto;
          data[i].start = cumulative;
          cumulative += data[i].value;
          data[i].end = cumulative;
          yMax = Math.max(yMax, cumulative);
          yMin = Math.min(yMin, cumulative);

          data[i].class = ( data[i].value >= 0 ) ? 'positive' : 'negative'
        }
        
        /*
        data.push({
          name: 'Total',
          end: cumulative,
          start: 0,
          class: 'total'
        });
        */
        
        // Set the gDataset global variable for use when adding moving averages
        gDataset = data;

        x.domain(data.map(function(d) { return d.name; }));
        min = d3.min(data, function(d) {return d.end;});
        if (yMin > 0)
          yMin = 0;            
        max = d3.max(data, function(d) { return d.end; })
        if (yMax < 0)
          yMax = 0

        gMaxY = yMax;
        gMinY = yMin;
        y.domain([yMin*1.07,yMax*1.07]);

        chart.append("g")
          .attr("class", "xaxis")
          .attr("transform", "translate(0," + height + ")")
          .call(xAxis)
          .selectAll("text")
          .attr("dx", "-.8em")
          .attr("dy", "-.55em")
          .attr("transform", "rotate(-90)")
          .style("text-anchor", "end");;

        chart.append("g")
          .attr("class", "yaxis")      
          .call(yAxis);
            
        chart.append("g")         
          .attr("class", "origin")
          .call(make_y_axis(y)
              .tickSize(-width, 0, 0)
              .tickFormat("")
          )
          
        
        var bar = chart.selectAll(".bar")
            .data(data)
          .enter().append("g")
            .attr("class", function(d) { return "bar " + d.class })
            .attr("transform", function(d) { return "translate(" + x(d.name) + ",0)"; })
            .on("mouseover", function(d) {		
                  div.transition()		
                      .duration(200)		
                      .style("opacity", .9);		
                  div	.html(d.fecha + "<br/>"  + "$" +d.value)	
                      .style("left", (d3.event.pageX) + "px")		
                      .style("top", (d3.event.pageY - 28) + "px");	
                  })					
              .on("mouseout", function(d) {		
                  div.transition()		
                      .duration(500)		
                      .style("opacity", 0);	
              });

        bar.append("rect")
          .attr("y", function(d) { return y( Math.max(d.start, d.end) ); })
          .attr("height", function(d) { return Math.abs( y(d.start) - y(d.end) ); })
          .attr("width", x.rangeBand());
          
        /*
        bar.append("text")
            .attr("x", x.rangeBand() / 2)
            .attr("y", function(d) { return y(d.end) + 5; })
            .attr("dy", function(d) { return ((d.class=='negative') ? '-' : '') + ".75em" })
            .text(function(d) { return dollarFormatter(d.end - d.start);});
        */
        bar.filter(function(d) { return d.class != "total" }).append("line")
            .attr("class", "connector")
            .attr("x1", x.rangeBand() + 5 )
            .attr("y1", function(d) { return y(d.end) } )
            .attr("x2", x.rangeBand() / ( 1 - padding) - 5 )
            .attr("y2", function(d) { return y(d.end) } )

            
        // Changing the X Axis label to the respective dates
        var items = $(".xaxis text");
        items.each(function (i){          
          $(this).text(formatDate(formatChartDate(data[i].fecha)));
        });
      }

      // Drawing the waterfall chart
      waterfall(data);
      // Drawing the table with the specified columns
      tabulate(data, ['fecha', 'id_cliente', 'neto']); 
      // Chaning the names of the table columns
      runReplaceHeaders(replacementsCashFlow);
  });
}

/**
 * This function displays the moving average on the chart
 */   
function drawMovingAverage(id_cliente){

  // Using the same svg dimensions as the waterfall chart
  var margin = {top: 20, right: 30, bottom: 60, left: 40},
          width = 900 - margin.left - margin.right,
          height = 475 - margin.top - margin.bottom,
          padding = 0.3;
      
      var x = d3.scale.ordinal()
          .rangeRoundBands([0, width], padding);
      
      var y = d3.scale.linear()
          .range([height, 0]);

  // Asynchronous data fetch using the MovingAverageView API
  // Once all data has been downloaded the code within this method is called..
  d3.json('http://127.0.0.1:8000/api/client/sma/'+id_cliente+'.json', function (error,data) {
  
    //Ensuring the right numeric values
    for (var i = 0; i < data.length; i++) {
      data[i].name = i+2; 
      data[i].sma = +data[i].sma;
    }
    
    // Using the global dataset to ensure the same scale is used.
    x.domain(gDataset.map(function(d) { return d.name; }));
    y.domain([gMinY*1.07,gMaxY*1.07]);

    // Selecting the chart element on the page
    var chart = d3.select(".chart").select("g") 

    // Defining the line positions
    var valueline = d3.svg.line()
      .x(function(d) {return x(d.name)+x.rangeBand()/2})
      .y(function(d) {return y(d.sma)})

    // Adding the path element
    var line = chart.append("path")
      .attr("class","line")
      .attr("d", valueline(data));

      // Define the div for the tooltip
    var div = d3.select("body").append("div")	
          .attr("class", "tooltip_line")				
          .style("opacity", 0);   

    // Defining the circles that will be used as the tooltip triggers
    var circle = chart.selectAll("sma")
      .data(data)
      .enter()
      .append("g")
      .attr("class","sma")
      .attr("transform",function(d) { return "translate("+x(d.name)+",0)"; })
      .append("circle")
        .attr("r",5)
        .attr("cx", (x.rangeBand()/2))
        .attr("cy", function(d) { return y(d.sma); })	
        .on("mouseover", function(d) {		
          div.transition()		
              .duration(200)		
              .style("opacity", .9);		
          div	.html(d.fecha + "<br/>"  + "$" +d.sma)	
              .style("left", (d3.event.pageX) + "px")		
              .style("top", (d3.event.pageY - 28) + "px");	
          })					
      .on("mouseout", function(d) {		
          div.transition()		
              .duration(500)		
              .style("opacity", 0);	
      });

    // Once the data is loaded and the graph is on screen, show the completion alert.
    showAlert();
  });
}

