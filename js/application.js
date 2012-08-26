$(document).ready(function()
{
	$userDetailsContainer = $('#user-details-container');
	$pagesReminderContainer = $('#pages-reminder-container');
	$errorMessage = $('#error-message');
	$pagesLoading = $('#pages-loading');
	init();
});

function init()
{
	$pagesReminderContainer.hide();
	$errorMessage.hide();
	$pagesLoading.hide();

	$('#main-nav a[href="#pages"]').click(function (e) {
	  e.preventDefault();
	  $(this).tab('show');
	})
	
	$('#main-nav a[href="#quick-reminder"]').click(function (e) {
	  e.preventDefault();
	  $(this).tab('show');
	})

	if (getItem('username') == undefined)
	{
		window.localStorage.clear();
		
		var $username = $('#username');
		var $useSsl = $('#use-ssl');

		$('#save').click(function(e) {
			e.preventDefault();

			if ($username.val().length > 0)
			{
				setItem('username', $username.val().toLowerCase());
				$useSsl.attr('checked') ? setItem('useSsl', true) : setItem('useSsl', false);
				$userDetailsContainer.hide();
				
				request('me.xml');
				request('ws/pages/all');
			}
			else
			{
				$('#username-control-group').addClass('error');
				$username.focus();
			}
	  });
	}
	else
	{
		var username = getItem('username');
		$userDetailsContainer.hide();

		if (getItem('userId') == undefined)
		{
			request('me.xml');
		}

		request('ws/pages/all');
	}
}

function initMainContent(xml)
{
	var username = getItem('username');

	$('#top-links').click(function(e) {
		e.stopPropagation();
		chrome.tabs.create({ url: getProtocol() + username + '.backpackit.com/' + $(event.target).attr('id') });
	});

	$(xml).find('page').each(function() {
		var $page = $(this);
		var $homeLink = $('#home');

		if ($page.attr('title').toLowerCase() != username + ' home')
		{
			$('#page-list').append('<li><a href="#" id="' + $page.attr('id') + '">' + $page.attr('title') + '</a></li>');
		}
		else
		{
			$homeLink.html($page.attr('title'));
			$homeLink.attr('id', $page.attr('id'));
		}
	});

	$('#page-list').click(function(event){
		$target = $(event.target);

		if ($target.is('a'))
		{
			chrome.tabs.create({ url: getProtocol() + username + '.backpackit.com/pages/' + $target.attr('id') });
		}
		else
		{
			chrome.tabs.create({ url: getProtocol() + username + '.backpackit.com/pages/' + $target.parent().attr('id') });
		}
	});

	$('#main-nav a[href="#pages"]').tab('show');
}

function initReminders()
{
	var userId = getItem('userId');
	var $remindAt = $('#remind-at');
	var $reminderText = $('#reminder-text');
	var $humanDate = $('#human-date');
	var $setReminder = $('#set-reminder');
	var $setReminderControlGroup = $('#set-reminder-control-group');

	$remindAt.find('option').eq(2).attr('value', '+' + tomorrow(9));
	$remindAt.find('option').eq(3).attr('value', '+' + tomorrow(14));
	$remindAt.find('option').eq(5).attr('value', '+' + nextMonday());
	$humanDate.html('');
	$remindAt.val('+180');

	$setReminder.click(function(e){
		e.preventDefault();
		var content = '';
		var postData = '';
		
		if ($remindAt.val() == 'specificTime')
		{
			content = $reminderText.val();
			var date = $('#date').val();
			var hour = $('#hour').val();
			var minute = $('#minute').val();
			var amPm = $('#am-pm').val();
			
			if (amPm == 'pm')
			{
				hour = parseInt(hour);
				hour += 12;
			}
			
			var reminderDateTime = date + ' ' + hour + ':' + minute + ':00';
			postData = '<reminder><remind_at>' + reminderDateTime + '</remind_at><content>' + content + '</content><remindees type="array"><user_id>' + userId + '</user_id></remindees></reminder>';
		}
		else
		{
			content = $remindAt.val() + " " + $reminderText.val();
			postData = '<reminder><content>' + content + '</content><remindees type="array"><user_id>' + userId + '</user_id></remindees></reminder>';
		}
		
		if ($reminderText.val().length > 0)
		{	
			request('reminders.xml', postData);
			$reminderText.val('');
			$setReminderControlGroup.removeClass('error');
		}
		else
		{
			$setReminderControlGroup.addClass('error');
			$reminderText.focus();
		}
	});
}

function initDateTimePicker()
{
	var $remindAt = $('#remind-at');
	var $time = $('#time');
	var $humanDate = $('#human-date');
	var $date = $('#date');
	var $quickReminder = $('#quick-reminder');
	$time.hide();

	$date.datepicker({
		dateFormat: 'yy-mm-dd',
		beforeShow: function(dateText, inst){
			$(this).val('');
			$humanDate.html('');
			$humanDate.hide();
		},
		onSelect: function(dateText, inst) {
			var dateSplit = dateText.split('-');
			$humanDate.show().html(new Date(dateSplit[0], dateSplit[1] - 1, dateSplit[2]).toLocaleDateString());
			$time.show();
		},
		onClose: function(){
			if ($(this).val().length == 0)
			{
				$time.hide();
				$remindAt.val('+180');
				$quickReminder.animate({ height: '124px' }, 100);
			}
		}
	});

	$remindAt.change(function(){
		if ($(this).val() == 'specificTime')
		{
			$quickReminder.animate({ height: '300px' }, 100);
			$date.datepicker('show');
		}
		else
		{
			$humanDate.hide();
			$time.hide();
		}
	});
}

function initPageListFilter()
{
	$('#filter').keyup(function() {
		var $searchQuery = $(this).children("input[type='text']").val();
		var $links = $('#page-list > li > a');

		$links.each(function() {
			var $link = $(this);
			
			if ($link.text().search(new RegExp($searchQuery, 'i')) == -1)
			{
				$link.hide();
			}
			else
			{
				var text = $link.text().replace("/</?strong>/g", "");
				
				if ($searchQuery.length != 0)
				{
					text = text.replace(new RegExp($searchQuery, 'ig'), function(match) {
						     return "<strong>" + match + "</strong>";
						   });
				}
				
				$link.html(text);
				$link.show();
			}
		});
	});
}

function request(path, postData)
{
	var username = getItem('username');
	var processFlag = true;
	var $reminderSuccess = $('#reminder-success');
	var $reminderLoading = $('#reminder-loading');
	
	if (postData != undefined && postData.length > 0)
	{
		processFlag = false;
	}

	$.ajax({
		type: 'POST',
		data: postData,
		dataType: 'xml',
		contentType: 'application/xml',
		processData: processFlag,
		url: getProtocol() + username + '.backpackit.com/' + path,
		beforeSend: function(xhr){
			xhr.setRequestHeader('X-POST_DATA_FORMAT', 'xml');
			if (path == 'reminders.xml')
			{
				$reminderLoading.show();
			}
			else
			{
				$pagesLoading.show();
			}
		},
		success: function(xml){
			if (path == 'ws/pages/all')
			{
				$pagesReminderContainer.show();
				initMainContent(xml);
				initPageListFilter();
				initReminders();
				initDateTimePicker();
				setCurrentTime();
			}
			else if (path == 'me.xml')
			{
				setItem('userId', $(xml).find('id').text());
			}
			else if (path == 'reminders.xml')
			{
				$reminderSuccess.show().fadeOut(2000);
			}
			else
			{
				console.log('Unknown path argument');
			}
		},
		error: function (xhr, ajaxOptions, thrownError){
			if (xhr.status == 403)
			{
				$('#error-message').show()
				$('#error-message-content').html("XHR error: " + xhr.status + " " + thrownError +
					". This probably means you need to login to Backpack. " + 
					'<a id="login" href="#">Login now</a>');

				$('#login').click(function(event){
					chrome.tabs.create({ url: getProtocol() + username + '.backpackit.com/login/' });
				});
			}
			else if (xhr.status == 422)
			{
				$('#error-message').show()
				$('#error-message-content').html("XHR error: " + xhr.status + " " + thrownError +
					". This probably means you tried to set a reminder in the past.");
			}
			else
			{
				$('#error-message').show()
				$('#error').html("XHR error: " + xhr.status + " " + thrownError + ".");
			}
		},
		complete: function() {
			if (path == 'reminders.xml')
			{
				$reminderLoading.hide();
			}
			else
			{
				$pagesLoading.hide();
			}
		}
	});
}

function setCurrentTime()
{
	var $hour = $('#hour');
	var $minute = $('#minute');
	var $amPm = $('#am-pm');
	var now = new Date();
	var currentHours = now.getHours();
	var currentMinutes = now.getMinutes();
	var currentTwelveHours = (currentHours > 12 ? currentHours - 12 : currentHours);
	var currentRoundedMinutes = (currentMinutes % 5) >= 2.5 ? parseInt(currentMinutes / 5) * 5 + 5 : parseInt(currentMinutes / 5) * 5;

	if (currentRoundedMinutes == 60)
	{
		currentRoundedMinutes = 0;
		currentTwelveHours += 1;
	}
	
	currentRoundedMinutes = ((currentRoundedMinutes <= 5) ? '0' : '') + currentRoundedMinutes.toString();
	var currentAmPm = (currentHours >= 12 ? 'pm' : 'am');

	$hour.val(currentTwelveHours.toString());
	$minute.val(currentRoundedMinutes);
	$amPm.val(currentAmPm);
}

function nextMonday()
{
	var now = new Date();
	var daysToNextMonday = 0;
	var day = now.getDay();

	switch(day)
	{
	case 0:
		daysToNextMonday = 1;
		break;
	case 1:
		daysToNextMonday = 7;
		break;
	case 2:
		daysToNextMonday = 6;
		break;
	case 3:
		daysToNextMonday = 5;
		break;
	case 4:
		daysToNextMonday = 4;
		break;
	case 5:
		daysToNextMonday = 3;
		break;
	case 6:
		daysToNextMonday = 2;
		break;
	default:
		console.log('The day variable is of an unrecognised value');
	}

	var nextMonday = new Date();
	nextMonday.setTime(now.getTime() + ((1000 * 3600 * 24) * daysToNextMonday));
	nextMonday.setHours(9);
	nextMonday.setMinutes(0);
	nextMonday.setSeconds(0);
	nextMonday.setMilliseconds(0);

	var diffMilliseconds = (nextMonday - now);
	var diffMinutes = Math.ceil((diffMilliseconds / 1000) / 60);
	return diffMinutes.toString();
}

function tomorrow(hour)
{
	var now = new Date();
	var tomorrow = new Date();
	tomorrow.setTime(now.getTime() + (1000 * 3600 * 24));
	tomorrow.setHours(hour);
	tomorrow.setMinutes(0);
	tomorrow.setSeconds(0);
	tomorrow.setMilliseconds(0);
	
	var diffMilliseconds = (tomorrow - now);
	var diffMinutes = Math.ceil((diffMilliseconds / 1000) / 60);
	return diffMinutes.toString();
}

function getProtocol()
{
	return getItem('useSsl') ? "https://" : "http://";
}