// TODO: Add reminder functionality.
// TODO: Add options page.
$(document).ready(function()
{
	//window.localStorage.clear();
	init();
});

function init()
{
	var $userDetails = $('#userDetails');
	var $main = $('#main');
	
	$('#loading').ajaxStart(function(){
		$(this).show();
	})
	.ajaxStop(function(){
	    $(this).hide();
	});

	$('#pageContainer').ajaxStart(function(){
		$(this).hide();
	})
	.ajaxStop(function(){
	    $(this).show();
	});

	if (getItem('username') == undefined)
	{
		$main.hide();
		var $username = $('#username');
		var $useSsl = $('#useSsl');
		
		$('#submit').click(function(){
			if ($username.val().length > 0)
			{
	    		setItem('username', $username.val().toLowerCase());
				
				if ($useSsl.attr('checked'))
				{
					setItem('useSsl', true);					
				}
				else
				{
					setItem('useSsl', false);
				}

				$userDetails.hide();
				$main.show();
				retrieveContent();
			}
			else
			{
				$username.addClass("error");
			}
	    });
	}
	else
	{
		$userDetails.hide();
		request("pages/all");
	}
}

function retrieveContent(xml)
{
	var username = getItem('username');

	$(xml).find('page').each(function(){
		var $page = $(this);
		var $homeLink = $('#home');

		if ($page.attr('title').toLowerCase() != username + ' home')
		{
			$('#pageList').append('<li id="' + $page.attr('id') + '">' + $page.attr('title') + '</li>');
		}
		else
		{
			$homeLink.html($page.attr('title'));
			$homeLink.attr('id', $page.attr('id'));
		}
	});

	$('#pageList').click(function(event){
		$target = $(event.target);

		if ($target.is('li'))
		{
			chrome.tabs.create({ url: getProtocol() + username + '.backpackit.com/pages/' + $target.attr('id') });			
		}
		else
		{
			chrome.tabs.create({ url: getProtocol() + username + '.backpackit.com/pages/' + $target.parent().attr('id') });
		}
	});

	$('#topLinks').click(function(event){
		chrome.tabs.create({ url: getProtocol() + username + '.backpackit.com/' + $(event.target).attr('id') });
	});

	initPageListFilter();
}

// TODO: Separate concerns better. The request() function should only manage XHR. Extract the other stuff.
function request(path)
{
	var username = getItem('username');

	$.ajax({
		type: "POST",
		dataType: "xml",
		url: getProtocol() + username + ".backpackit.com/ws/" + path,
		beforeSend: function(xhr){
			xhr.setRequestHeader("X-POST_DATA_FORMAT", "xml");
		},
		success: function(xml){
			if (path == "pages/all")
			{
				retrieveContent(xml);				
			}
			else if (path == "/reminders.xml")
			{
				// POST reminder.
			}
			else
			{
				// Log error.
			}
		},
		error:function (xhr, ajaxOptions, thrownError){
			if (xhr.status == 403)
			{
				$('#main').hide('slow');
				$('#error').html("<p>XHR error: " + xhr.status + " " + thrownError + "</p>" +
						   		 "<p>This probably means you need to login to Backpack.</p>" + 
						   		 '<p id="login"><a href="#">Login now</a><p>').show();

				$('#login > a').click(function(event){
					chrome.tabs.create({ url: getProtocol() + username + '.backpackit.com/login/' });
				});
			}
			else
			{
				$('#error').html("<p>XHR error: " + xhr.status + " " + thrownError + "</p>").show();
			}
		}
	});
}

function getProtocol()
{
	return getItem('useSsl') ? "https://" : "http://";
}

function initPageListFilter()
{
	$('#filterForm').keyup(function() {
		var $searchQuery = $(this).children("input[type='text']").val();
		var $listItems = $('#pageList > li');

		$listItems.each(function(){
			var $listItem = $(this);
			
			if ($listItem.text().search(new RegExp($searchQuery, 'i')) == -1)
			{
				$listItem.hide();
			}
			else
			{
				var text = $listItem.text().replace("/</?strong>/g", "");
				
				if ($searchQuery.length != 0)
				{
					text = text.replace(new RegExp($searchQuery, 'ig'), function(match) {
						     return "<strong>" + match + "</strong>";
						   });
				}
				
				$listItem.html(text);
				$listItem.show();
			}
		});
	});
}

function getItem(key)
{
	var item;

	try
	{
		item = window.localStorage.getItem(key);
	}
	catch(e)
	{
		console.log('Error getting local storage item: ' + e);
		item = null;
	}
	
	return item;
}

function setItem(key, value)
{
	try
	{
		window.localStorage.removeItem(key);
		window.localStorage.setItem(key, value);
	}
	catch(e)
	{
		console.log('Error setting local storage item: ' + e);
		return false;
	}
	
	return true;
}