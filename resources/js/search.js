function setupSearch() {
	console.log("Setting up Search");
	$.get("/api/page-list", {}, function(response) {
   	    var responseObj = JSON.parse(response);

   	    window.pageList = responseObj.Pages;
   	    window.searchList = [];

   	    for(var i = 0; i <= window.pageList.length; i++) {
   	    	var page = window.pageList[i];
   	    	window.searchList.push({
   	    		full: page,
   	    		searched: page
   	    	});
   	    }
   	});

	$(".search-bar").on("input", handleSearchInput);
	$(".search-bar").keydown(function(e) {
    	if(e.which == 38 || e.which == 40){
    	    e.preventDefault();
    	}
    	var currentPicked = $(".picked-result");
	    if (currentPicked.length) {
		    switch(e.which) {
		        case 13: // enter
		        	break;
		        case 38: // up
		        	if (currentPicked.prev().length) { // ensure a prev
			        	currentPicked.prev().addClass("picked-result");
			        	$(".search-results").attr("picked-result", currentPicked.prev().attr("val"));
						currentPicked.removeClass("picked-result");
		        	}
		        	break;
		        case 40: // down
		        	if(currentPicked.next().length) { // ensure a next
		        		currentPicked.next().addClass("picked-result");
		        		$(".search-results").attr("picked-result", currentPicked.next().attr("val"));
						currentPicked.removeClass("picked-result");		        		
		        	}
		        	break;
		        default:
		        	return; // exit this handler for other keys
		    }
	    }
   	});
}

function handleSearchInput() {
	var search = $(".search-bar").val();
	if (search === ""){
		$(".search-results").html("");
		return;
	}

	var results = fuzzySearch(search, window.pageList);

	$(".search-results").html("");
	for(var i = 0; i < results.length && i < 10; i++) { // only top 10 results
		var newResult = $("<p></p>")
		newResult.addClass("search-result");
		
		var text = "";
		for(j = 0; j < results[i].item.length; j++) {
			if (results[i].indices.indexOf(j) !== -1) {
				text += "<b class='fuzzy-bold'>" + results[i].item[j] + "</b>";
			} else {
				text += results[i].item[j];
			}
		}
		
		newResult.html(text);
		$(".search-results").append(newResult)
	}

	$(".search-results .search-result").first().addClass("picked-result");
}

// query is the search string, list is an array of strings to match
// Returns a list of strings that match the query and is sorted by closest match
function fuzzySearch(query, list) {
	var fuzzyResults = [];
	for(var i = 0; i < list.length; i++){
		var item = list[i];
		res = fuzzyMatch(query, item);
		if (res.fuzzyScore !== -1){
			fuzzyResults.push({
				item: item, 
				fuzzyScore: res.fuzzyScore,
				indices: res.indices,
			});
		}
	}

	fuzzyResults.sort(function(a, b) {
		return a.fuzzyScore > b.fuzzyScore;
	});
	return fuzzyResults;
}

// Returns -1 if search does not fuzzyMatch str
// Otherwise returns a fuzzyScore, closer to 0 indicates a closer match
function fuzzyMatch(search, str) {
	searched = str;
	fuzzyScore = 0;
	
	currIndex = 0;
	indices = [];
	
	for(var i = 0; i < search.length; i++) {
		key = search[i].toLowerCase();
		index = searched.indexOf(key);
		if (index === -1) {
			return {fuzzyScore:-1, indices:[]};
		} else {
			currIndex += index;
			indices.push(currIndex);
			fuzzyScore += index * Math.pow(10, search.length-1-i);
			searched = searched.substr(index + 1, searched.length);
			currIndex += 1;
		}
	}
	return {fuzzyScore: fuzzyScore, indices: indices};
}


/*
FUZZY SCORE CALCULATION
=======================

~ == fuzzy operator

(som, esolom)
----------------
Iterations
	s ~ esolom  = olom, index = 1
	o ~ olom  = lom, index = 0
	m ~ lom  = , index = 3
FuzzyScore = 103 = (1 * 10^2) + (0 * 10^1) + (3 * 10^0)

(som, something)
----------------
Iterations
	s ~ something  = omething, index = 0
	o ~ omething  = mething, index = 0
	m ~ mething  = ething, index = 0
FuzzyScore = 0 = (0 * 10^2) + (0 * 10^1) + (0 * 10^0)

(som, epsilome)
----------------
Iterations
	s ~ epsilome  = ilome, index = 2
	o ~ ilome  = me, index = 2
	m ~ me  = e, index = 0
FuzzyScore = 220 = (2 * 10^2) + (2 * 10^1) + (0 * 10^0)

*/
