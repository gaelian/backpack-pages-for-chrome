// TODO: keyboard shortcuts?
// TODO: Handle 422 (OK) response when reminder is in the past?
$(document).ready(function()
{
	init();
});

function init()
{
	var $userDetails = $('#userDetails');
	var $main = $('#main');
	var $reminderForm = $('#reminderForm');
	$('#success').hide();

	if (getItem('username') == undefined)
	{
		var $username = $('#username');
		var $useSsl = $('#useSsl');

		$main.hide();
		window.localStorage.clear();
		
		$('#save').click(function(){
			if ($username.val().length > 0)
			{
				setItem('username', $username.val().toLowerCase());
				$useSsl.attr('checked') ? setItem('useSsl', true) : setItem('useSsl', false);
				$userDetails.hide();
				$reminderForm.hide();
				$main.show();
				request('ws/pages/all');
				request('me.xml');
			}
			else
			{
				$username.addClass('error');
			}
	    });
	}
	else
	{
		var username = getItem('username');
		$userDetails.hide();
		$reminderForm.hide();
		request('ws/pages/all');
	}
}

function initMainContent(xml)
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
		event.stopPropagation();
		chrome.tabs.create({ url: getProtocol() + username + '.backpackit.com/' + $(event.target).attr('id') });
	});

	$('#addReminder').click(function(event){
		event.stopPropagation();
		initReminders();
	});

	initPageListFilter();
}

function initReminders()
{
	var userId = getItem('userId');
	var $main = $('#main');
	var $remindAt = $('#remindAt');
	var $reminderText = $('#reminderText');
	var $reminderForm = $('#reminderForm');
	var $addReminder = $('#addReminder');
	var $topLinks = $('#topLinks');
	var $pageContainer = $('#pageContainer');

	$addReminder.hide();
	$topLinks.hide();
	$pageContainer.hide();
	$reminderForm.show();
	$remindAt.find('option').eq(2).attr('value', '+' + tomorrow(9));
	$remindAt.find('option').eq(3).attr('value', '+' + tomorrow(14));
	$remindAt.find('option').eq(5).attr('value', '+' + nextMonday());
	$('#loading').addClass('loadingReminder');
	$('#success').addClass('successReminder');

	$('#setReminder').click(function(event){
		var content = '';
		var postData = '';
		
		if ($remindAt.val() == 'specificTime')
		{
			content = $reminderText.val();
			var date = $('#date').val();
			var hour = $('#hour').val();
			var minute = $('#minute').val();
			var amPm = $('#amPm').val();
			
			if (amPm == 'pm')
			{
				hour = parseInt(hour);
				hour += 12;
			}
			
			var reminderDateTime = date + ' ' + hour + ':' + minute + ':' + '00';
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
			$reminderText.removeClass('error');
		}
		else
		{
			$reminderText.addClass('error');
		}
	});

	$('#back').click(function(event){
		event.preventDefault();
		event.stopPropagation();
		$reminderForm.hide();
		$main.show();
		$addReminder.show();
		$topLinks.show();
		$pageContainer.show();
		$('#humanDate').html('');
		$remindAt.val('+180');
		$main.animate({ width:'250px' }, 100);
	});

	$main.animate({ width:'450px', height: '153px' }, 100);
	initDateTimePicker();
}

function initDateTimePicker()
{
	var $main = $('#main');
	var $remindAt = $('#remindAt');
	var $time = $('#time');
	var $humanDate = $('#humanDate');
	var $date = $('#date');
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
			}

			$main.animate({ width:'450px', height: '153px' }, 100);
		}
	});

	$remindAt.change(function(){
		if ($(this).val() == 'specificTime')
		{
			$main.animate({ width:'450px', height: '290px' }, 100);
			$date.datepicker('show');
		}
		else
		{
			$humanDate.hide();
			$time.hide();
		}
	});

	setCurrentTime();
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

function request(path, postData)
{
	var username = getItem('username');
	var processFlag = true;
	var $pageContainer = $('#pageContainer');
	var $success = $('#success');
	var $loading = $('#loading');
	
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
			$pageContainer.hide();
			$success.hide();
			$loading.show();
		},
		success: function(xml){
			if (path == 'ws/pages/all')
			{
				initMainContent(xml);
				$pageContainer.show();
				$loading.hide();
			}
			else if (path == 'me.xml')
			{
				setItem('userId', $(xml).find('id').text());
			}
			else if (path == 'reminders.xml')
			{
				$loading.hide();
				$success.show().fadeOut(2000);
			}
			else
			{
				console.log('Unknown path argument');
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
				$('#main').hide('slow');
				$('#error').html("<p>XHR error: " + xhr.status + " " + thrownError + "</p>").show();
			}
		}
	});
}

function setCurrentTime()
{
	var $hour = $('#hour');
	var $minute = $('#minute');
	var $amPm = $('#amPm');
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
	var currentAmPm = (currentHours > 12 ? 'pm' : 'am');

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