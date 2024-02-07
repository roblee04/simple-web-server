try {	
	//if ( document.cookie.indexOf('scu_alert_test=1')  >= 0 ) {

		$(document).ready(function() {
			$.ajax({
				type: 'GET',
				url: '/appdata/site-alerts.json?c='+Math.random(),
				jsonp: "callback",
				jsonpCallback: 'jsonCallback',
				contentType: "application/json",
				dataType: 'jsonp',                
				error: function(e) {
					console.log(e);
					console.log(e.message);
				}
			});
		});
	//}
} catch(err) {
  console.log( err.message );
}


function displaySiteAlert(data) {
	if (typeof notifScope == 'undefined') {
		notifScope = 'site-wide';
	}
	
	if ( notifScope == 'portal' ) {
		infoMsgTarget= $('#banner');
	} else {
		infoMsgTarget= $('#navbarUsers');
	}

	emergencyText = '';
	allDis = [];
	allDisTxt = '';
	
	if ( data.length > 0 ) {
	   for(var i=0; i < data.length; i ++ ) {
		   ann = data[i];                      
		   if (ann['scope'] == 'site-wide' || notifScope == ann['scope']) {  //if in scope
			   
				if ( ! hasAnnBeenDismissed( ann['id'] ) ) { //show alert
					svrty =  ann['severity'].toLowerCase();
				   	if ( ['emergency', 'extreme'].includes(svrty) ) {
						emergencyText +=  '<div class="emgcyBody dismissable " id="'+ann['id']+'">\
												<div class="emgcyPubDate">'+ann['pubDate']+'</div>'+
												ann['title']+(ann['fulldescription']!=''?':':'')+' ' + ann['fulldescription']+
											'</div>';
				   	} else if ( svrty == 'status alert' && ann['scope'] == 'portal') {
						$('#navbarUsers').append('<div class="card  p-2"><strong>'+ann['title']+'</strong>'+  ann['fulldescription']+'<div class="small text-right text-muted">Posted:'+ann['pubDate']+'</div>');
						$('#statusPanel .countNbr').text( $('#navbarUsers>.card').length );
				   	} else {
					   out = '\n<div class=" alert alert-site-wide alert-primary alert-dismissable mb-0" style="background-color:#'+(['warning', 'severe'].includes(svrty)?'d9534f':'033b4c')+';border:0;" role="alert" id="'+ann['id']+'">';
					   out += '\n\t<div class="container d-flex align-items-center dismissable" id="'+ann['id']+'">';
					   out += '\n\t\t<div class="alert-body text-white mr-auto text-center">';
					   out += '\n\t\t<button type="button" class="float-right mt-1 btn text-white ml-1 dismiss-alert" data-dismiss="alert" aria-label="Close"><span class="fal fa-times-square" style="font-size: 22px;"></span></button>';
					   out += '<strong>'+ann['title']+'</strong> '+(ann['fulldescription']!=''?':':'')+' ' + ann['fulldescription']+'</div>';
					   out += '\n\t</div>';
					   out += '\n</div>';
					   infoMsgTarget.after(out ); 
				   	}


			   	} else { //was dismissed
					allDis.push(ann);
					allDisTxt += '<hr><div><strong>'+ann['pubDate']+'</strong> - '+ann['title']+(ann['fulldescription']!=''?':':'')+' ' + ann['fulldescription']+'</div>';
			   	}		   
			   
		   }
	    }
		
		if ( allDis.length > 0 ) {
		   out = '	<div class=" alert alert-site-wide alert-primary alert-dismissable mb-0" style="background-color:#033b4c;border:0;" role="alert"><div class="container d-flex align-items-center>\
			<div class="accordion" style="padding:.4rem 1.5rem;background-color:#033b4c;border:0;color:white" id="dismissedNots"><div>\
				<div role="alert" data-toggle="collapse" data-target="#collapseOne" aria-expanded="true">     \
					<span class="title small">'+allDis.length+ ' dismissed notifications </span>\
					<span class="accicon"><i class="fas fa-angle-down rotate-icon"></i></span>\
				</div>\
				<div id="collapseOne" class="collapse" data-parent="#dismissedNots">'+allDisTxt+'</div>\
			</div></div></div></div>';
		  
		   infoMsgTarget.after(out ); 
		}
		
		
		if ( emergencyText != '' ) {
console.log( 'MODAL '); 			
			emModal ='  <div class="modal alert-site-wide" id="emgcyModal" tabindex="-1">\
			  <div class="modal-dialog modal-dialog-centered">\
				<div class="modal-content">\
				  <div id="emgcyHeader"><span class="fal fa-exclamation-triangle"aria-hidden=true></span> SCU BRONCO ALERT NOTIFICATION</div>\
				  <div class="modal-body">'+emergencyText+'<div class="emgcyLink"><a href="https://emergency.scu.edu" class="btn btn-outline-danger">Latest Emergency Updates</a></div>\
					  <div class="emgcyClose">\
						<a href=# data-dismiss="modal" class="dismiss-alert" aria-label="Close"> &times;&nbsp;Dismiss</a>\
					  </div>\
				  </div>\
				</div>\
			  </div>\
			</div>\
			<style>\
			#emgcyModal { border-radius: 0;	}\
			.emgcyBody { padding-top:35px;	}\
			#emgcyHeader { background-color: #9e1b32; color:white; text-align:center; padding:2rem; font-size:1.4em;	}\
			#emgcyModal .modal-body { padding:1rem; 	}\
			.emgcyPubDate, .emgcyLink, .emgcyClose, .emgcyBody {text-align:center; }\
			.emgcyPubDate {font-weight:bold;font-size:.85em;padding-bottom:.5rem; }\
			.emgcyLink {padding-top:2.5rem} \
			.emgcyClose {padding:.5rem} \
			</style> ';			
			$('body').before(emModal ); 
			$('#emgcyModal').modal();
		}
   }

   $('.dismiss-alert').click(function() {			
	   $('.dismissable',$(this).closest('.alert-site-wide')).each(function() {
		   alertID = $(this).prop('id');  
		   arr = getLocalStorageArr('dismissedAlerts');
		   arr.push(alertID);
		   setLocalStorageArr('dismissedAlerts',arr);
	   });	   
   });
}

function hasAnnBeenDismissed(id){
	dismissed = getLocalStorageArr('dismissedAlerts');
	if ( dismissed.indexOf(id) == -1 ) {
		return false;
	}
	return true;
}

function setLocalStorageArr(name,value) {
	localStorage.setItem(name, JSON.stringify(value));
}

function getLocalStorageArr(name) {
	try {
		storedVal = localStorage.getItem(name);
		if ( !storedVal ) 
			return [];
		parsedArr =  JSON.parse(storedVal);
		if ( !parsedArr || typeof parsedArr == 'string')
			return [];
		return parsedArr;
	} catch(err) {
	  console.log( err.message );
	}
	return [];
}