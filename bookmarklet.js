/*
 * @title bookmarklet
 * @description my bookmarklet
 * @include http://*
 * @license MIT License
 * @require 
 */

(function(){

var d=document;
var s=d.createElement('script');
s.src=(function(){
	var total = {};
	var year = '2014';
	var all = false;
	function init(num) {
		if(typeof num !== 'number') {
			num = 0;
			year = window.prompt('何年分の注文を集計しますか？\n半角数字4桁で入力してください\n（全期間を集計する場合は「all」と入力）', '2014');
			if(year === 'all') {
				all = true;
				year = $('#orderFilter option:last').val().match(/[0-9]/g).join('');
			} else if(!/^[0-9]{4}$/.test(year)) {
				alert('正しい数値を入力してください');
				return false;
			}
			year = Number(year);
			total[year] = 0;
		}
		var progress = load(num);
		progress.done(function(price){
			total[year] += price;
			init(num+1);
		}).fail(function(){
			if(all && new Date().getFullYear() > year) {
				year++;
				total[year] = 0;
				init(0);
			} else {
				var txt = 'あなたは\n';
				var _total = 0;
				$.each(total, function(year, yen){
					txt += year + '年 合計' + addFigure(yen) + '円分\n';
					_total += yen;
				});
				if(all) txt += '総計' + addFigure(_total) + '円分\n';
				alert(txt + 'の買い物をAmazonでしました！');
			}
		});
	}
 
	function load(num) {
		var df = $.Deferred();
		var page = get(num);
		page.done(function(json){
			var _total = 0;
			for (var i=0; i<json.length; i++) {
				var item = json[i];
				if (item[1] !== "order") continue;
				var dom = $.parseHTML(item[2]);
				// 注文単位のループ
				if (dom && dom.length > 1) {
					var arr1 = $(dom).find("div.a-row > span.a-size-small");
					var price = $(arr0[1]).text().match(/[0-9]/g).join('');
					_total += (Number(price));
				}
			}
			if(_total === 0) df.reject();
			else df.resolve(_total);
		});
		return df.promise();
	}
 
	function get(num) {
		var df = $.Deferred();
		var url = 'https://www.amazon.co.jp/gp/css/order-history/?orderFilter=year-'+year+'&startIndex='+num*10;
		$.ajax({
			url: url,
			success: function(data, status){
				df.resolve(data);
			},
			error: function(request, status, errorThrown){
				/* 変形jsonをjsonに変換 */
				var responseText = request['responseText'];
				responseText = responseText.replace(/&&&/g, ',');
				responseText = responseText.replace(/\n\s*\n/g, '');
				responseText = responseText.replace(/\n/g, '');
				responseText = responseText.replace(/,$/, '');
				var jsonText = '[' + responseText + ']';
				var json = $.parseJSON(jsonText);
				df.resolve(json);
			}
		});
		return df.promise();
	}
 
	function addFigure(str) {
		var num = new String(str).replace(/,/g, "");
		while(num != (num = num.replace(/^(-?\d+)(\d{3})/, "$1,$2")));
		return num;
	}
	if(typeof $ !== 'function') {
		var d=document;
		var s=d.createElement('script');
		s.src='//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js';
		s.onload=init;
		d.body.appendChild(s);
	} else {
		init();
	}
})();
d.body.appendChild(s);

})();
