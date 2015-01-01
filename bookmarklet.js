/*
 * @title bookmarklet
 * @description my bookmarklet
 * @include http://*
 * @license MIT License
 * @require 
 */


var d=document;
var s=d.createElement('script');
s.src=(function(){

	var datePattern = new RegExp("(\\d{4})年(\\d{1,2})月(\\d{1,2})日");
	/* TSVの出力形式を指定する */
	function formatEntry(entry) {
		entry.date.match(datePattern);
		var year = RegExp.$1;
		var month = RegExp.$2; if (month.length <= 1) month = "0" + month;
		var day = RegExp.$3; if (day.length <= 1) day = "0" + day;
		var date = "" + year + "/" + month + "/" + day;
		var arr = [date, entry.name, entry.author, entry.url];
		return arr.join('\t') + "\n";
	}
	 
	var total = {};
	var year = '2012';
	var all = false;
	var ret = [];
	function init(num) {
		if(typeof num !== 'number') {
			num = 0;
			year = window.prompt('何年分の注文を集計しますか？\n半角数字4桁で入力してください\n（全期間を集計する場合は「all」と入力）', '2012');
			if(year === 'all') {
				all = true;
				year = $('#orderFilter option:last').val().match(/[0-9]/g).join('');
			} else if(!/^[0-9]{4}$/.test(year)) {
				alert('正しい数値を入力してください');
				$('#___overlay').remove();
				return false;
			}
			year = Number(year);
			total[year] = 0;
		}
		var progress = load(num);
		$('#___overlay').text(year+'年の集計中…  / '+(num+1)+'ページ目');
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
				var content = "";
				$.each(ret, function(i, item) {
					content += formatEntry(item);
				});
				popup(content).alert(txt + 'の買い物をAmazonでしました！');
				$('#___overlay').remove();
			}
		});
	}

	function popup(content) {
		var generator=window.open('','name','height=250,width=700');
		generator.document.write('<html><head><title>Amazon to CSV</title>');
		generator.document.write('</head><body>');
		generator.document.write('<pre>');
		generator.document.write(content);
		generator.document.write('</pre>');
		generator.document.write('</body></html>');
		generator.document.close();
		return generator;
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
					var text = dom[1].innerText;
					var arr0 = $(dom).find(".a-size-base");
					var arr1 = $(dom).find("div.a-row > span.a-size-small");
					var arr2 = $(dom).find("div.a-row > a.a-link-normal");
					var price = $(arr0[1]).text().match(/[0-9]/g).join('');
					var date = $(arr0[0]).text().replace(/(^\s+|\s+$)/g, '');
					for (var j=0; j<arr2.length; j++) {
						var item= {};
						item.name = $(arr2[j]).text().replace(/(^\s+|\s+$)/g, '');
						item.path = $(arr2[j]).attr('href').replace(/(^\s+|\s+$)/g, '');
						item.url = 'https://www.amazon.co.jp' + item.path;
						item.date = date;
						item.author = $(arr1[j*2]).text().replace(/(^\s+|\s+$)/g, '');
						ret.push(item);
					}
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

