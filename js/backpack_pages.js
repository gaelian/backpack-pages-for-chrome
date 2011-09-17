$(document).ready(function()
{
	//window.localStorage.clear();
	init();
});

function init()
{
	var $userDetails = $('#userDetails');
	var $main = $('#main');
	$('#loading').hide();

	if (getItem('username') == undefined)
	{
		$main.hide();
		var $username = $('#username');
		var $useSsl = $('#useSsl');
		
		$('#submit').click(function() {
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
		retrieveContent();
	}
}

function retrieveContent()
{
	var username = getItem('username');
	request("pages/all");
	
	$('#pageList').click(function(event){
		chrome.tabs.create({ url: getProtocol() + username + '.backpackit.com/pages/' + $(event.target).attr('id') });
	});

	$('#topLinks').click(function(event){
		chrome.tabs.create({ url: getProtocol() + username + '.backpackit.com/' + $(event.target).attr('id') });
	});
}

function request(path)
{
	var username = getItem('username');
	var $loading = $('#loading');
	var $pageList = $('#pageList');
	var $pageContainer = $('#pageContainer');

	// TODO: Make this AJAX call more robust.
	$.ajax({
		type: "POST",
		dataType: "xml",
		url: getProtocol() + username + ".backpackit.com/ws/" + path,
		beforeSend: function(xhr) {
			$loading.show();
			$pageContainer.hide();
			xhr.setRequestHeader("X-POST_DATA_FORMAT", "xml");
		},
		success: function(xml) {
			$(xml).find('page').each(function() {
				var $page = $(this);
				var $homeLink = $('#home');

				if ($page.attr('title').toLowerCase() != username + ' home')
				{
					$pageList.append('<li id="' + $page.attr('id') + '">' + $page.attr('title') + '</li>');
				}
				else
				{
					$homeLink.html($page.attr('title'));
					$homeLink.attr('id', $page.attr('id'));
				}
			});
			
			initPageListFilter();
			$pageContainer.show();
		},
		complete:function() {
			$loading.hide();
		},
		error:function (xhr, ajaxOptions, thrownError) {
			alert("Error sending XHR request.\n\n" + "Status: " + xhr.status + "\n\n" + thrownError);
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
		alert('Error getting local storage item: ' + e);
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
		alert('Error setting local storage item: ' + e);
		return false;
	}
	
	return true;
}