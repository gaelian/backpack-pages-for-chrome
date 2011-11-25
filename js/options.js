$(document).ready(function()
{
	init();
});

function init()
{
	var $success = $('#success');
	var $username = $('#username');
	var $useSsl = $('#useSsl');

	$success.hide();
	$username.val(getItem('username'));

	if (getItem('useSsl') == 'true')
	{
		$useSsl.attr('checked', true);
	}
	else
	{
		$useSsl.attr('checked', false);
	}

	$('#save').click(function(){
		event.preventDefault();

		if ($username.val().length > 0)
		{
			setItem('username', $username.val().toLowerCase());
			$useSsl.attr('checked') ? setItem('useSsl', true) : setItem('useSsl', false);
		}
		else
		{
			removeItem('username');
			removeItem('userId');
			removeItem('useSsl');
		}

		$success.show().fadeOut(2000);
	});
}