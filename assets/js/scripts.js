angular.module("reportsApp", ['moment-picker','myDirectives'])   
    .controller("mainController", function ($scope, $http, $timeout, $window) {
        $scope.report = {reportdetails : [{}] };
        $scope.currentdate = moment();

         $scope.renderEmailVisibility = function(){
            $scope.report.reportdetails.forEach(function (reportdetail, index) {
                $scope.showemail = false;
                if(!reportdetail._id) return;
                $scope.showemail = true;
            });
        };

        $scope.report.onChange = function () {
            $scope.report.date = moment($scope.currentdate).format("YYYY-MM-DD");
            $http.get("/report/" + $scope.report.date)
                .then(function (response) {
                        $scope.report.login = response.data.length ? response.data[0].login : {};
                        $scope.report.logout = response.data.length ? response.data[0].logout : {};
                        $scope.report.reportdetails = response.data.length && response.data[0].reportdetails.length > 0 ? response.data[0].reportdetails : [{}];                        
                        $scope.renderEmailVisibility();
                });
        };

        $scope.report.onChange();

        $scope.add = function (index) {
            $scope.report.reportdetails.push([index].reportdetail);
            $scope.report.reportdetails[index + 1] = {};
            $scope.renderEmailVisibility();
        };

        $scope.remove = function (index) {
            var reportdetail_id = this.reportdetail._id || false;
            reportdetail_id ? $scope.action('delete', reportdetail_id) : $scope.report.reportdetails.splice(index, 1);
            $scope.renderEmailVisibility();
        };

        $scope.action = function (actiontype, reportdetail_id) {
            var data = JSON.stringify($scope.report);
            var url = "/report/" + $scope.report.date;

            if(actiontype == 'delete'){
                if(!confirm("Are you sure you want to delete this report" + ( reportdetail_id ? "line ?" : " ?"))) return false;
            }

            $http({
                url : reportdetail_id ? url + "/" + reportdetail_id : url,
                data: data,
                method: actiontype,
                headers: {"Content-Type": "application/json;charset=utf-8"}
            }).then(function (response) {
                if (response.status == 200) {
                    if(response.data){
                        alert(response.data);
                        $scope.report.onChange();
                    }
                }
            });
        };
                
        $scope.email = function(){
            var div = document.querySelector('#imagecontainer');
            var selecteddate = document.querySelector("#currentdate").value;
            var canvas = document.createElement('canvas');

            div.style.display = "block";

            var scaleBy = 5;
            var w = 1000;
            var h = 1000;
            canvas.width = w * scaleBy;
            canvas.height = h * scaleBy;
            canvas.style.width = w + 'px';
            canvas.style.height = h + 'px';
            var context = canvas.getContext('2d');
            context.scale(scaleBy, scaleBy);

            html2canvas(div, {
                canvas:canvas,
                onrendered: function (canvas) {
                    div.style.display = "none";           
                    var canvasData = canvas.toDataURL("image/png");           
                    
                    jQuery.ajax({
                        url: '/report/email/'+selecteddate,
                        type: 'POST',
                        data: {imgData: canvasData},
                        contentType:'application/x-www-form-urlencoded'                  
                    }).done(function(response){
                        alert(response);
                    });
                }
            });
        };
    });