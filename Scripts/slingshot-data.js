/*
 Copyright (c) 2012 Neudesic, LLC

 Permission is hereby granted, free of charge, to any person obtaining
 a copy of this software and associated documentation files (the
 "Software"), to deal in the Software without restriction, including
 without limitation the rights to use, copy, modify, merge, publish,
 distribute, sublicense, and/or sell copies of the Software, and to
 permit persons to whom the Software is furnished to do so, subject to
 the following conditions:

 The above copyright notice and this permission notice shall be
 included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

var slingshot;
slingshot = new
    function () {
        // private methods and properties
        var Debug = function (sender, message) {
            if (slingshot.verbose) {
                console.log([new Date().getTime(), " : ", "slingshot.", sender, " : ", message].join(""));
            }
        };

        var Error = function (sender, message) {
            console.error([new Date().getTime(), " : ", "slingshot.", sender, " : ", message].join(""));
        };

        // public variables
        this.verbose = true;
        this.runningInCordova = false;
        this.username = "";
        this.password = "";
        this.server = "";
        this.announcementsUri = '/_vti_bin/listdata.svc/Announcements';
        this.tasksUri = '/_vti_bin/listdata.svc/Tasks';
        this.documentsUri = '/_vti_bin/listdata.svc/SharedDocuments';
        this.userInformationUri = '/_vti_bin/listdata.svc/UserInformationList';
        this.copyWebServiceUri = '/_vti_bin/copy.asmx';
        this.listWebServiceUri = '/_vti_bin/lists.asmx';
        this.workflowWebServiceUri = '/_vti_bin/workflow.asmx';
        this.rootFolder = '/Shared Documents';
        this.testserver='slingshottest';
        this.taskListGuid = "";

        // Function to retrieve an ODATA object by Id
        var getObject = function(uri, id, callback, errorCallback)
        {
            Debug('getObject',[uri,id].join(','));
            var requestUri = "";
            if (slingshot.runningInCordova)
            {
                var uriString = [uri, '(', id, ')'].join('');
                requestUri = {
                    requestUri:['http://',slingshot.server,uriString].join(''),
                    user:slingshot.username,
                    password:slingshot.password
                };
            }
            else
            {
                requestUri = {
                    requestUri:[uri, '(', id, ')'].join('')
                };
            }

            OData.request(
                    requestUri
                , function (data) {
                    callback(data);
                }, function (error) {
                    errorCallback(error);
                });
        };

        // Function to retrieve an array of ODATA objects
        var getObjects = function(uri, callback, errorCallback)
        {
            Debug('getObjects',[uri].join(','));
            var requestUri = "";
            if (slingshot.runningInCordova)
            {
                requestUri = {
                    requestUri:['http://',slingshot.server,uri].join(''),
                    user:slingshot.username,
                    password:slingshot.password
                };
            }
            else
            {
                requestUri = {
                    requestUri:uri
                };
            }

            OData.request(requestUri,
                function (data) {
                callback(data);
            }, function (error) {
                errorCallback(error);
            });
        };

        // Function to add an ODATA object
        var addObject = function(uri, newObject, callback, errorCallback)
        {
            Debug('addObject',[uri, newObject.Id, newObject.Title].join(','));
            var requestUri = "";
            if (slingshot.runningInCordova)
            {
                requestUri = {
                    requestUri:['http://',slingshot.server,uri].join(''),
                    user:slingshot.username,
                    password:slingshot.password,
                    method:"POST",
                    data: newObject
                };
            }
            else
            {
                requestUri = {
                    requestUri:uri,
                    method:"POST",
                    data: newObject
                };
            }

            OData.request(
                  requestUri
                , function (data, response)
            {
                callback(data, response);
            }, function (error)
            {
                errorCallback(error);
            });
        };

        // Function to modify an ODATA object
        var modifyObject = function(uri, modifiedObject, callback, errorCallback)
        {
            Debug('modifyObject',[uri, modifiedObject.Id, modifiedObject.Title].join(','));
            var requestUri = "";
            if (slingshot.runningInCordova)
            {
                var uriString = [uri, '(', modifiedObject.Id, ')'].join('');
                requestUri = {
                    requestUri:['http://',slingshot.server,uriString].join(''),
                    user:slingshot.username,
                    password:slingshot.password,
                    method:"POST",
                    headers:{"X-HTTP-Method":"MERGE","If-Match":"*"},
                    data: modifiedObject
                };
            }
            else
            {
                requestUri = {
                    requestUri:[uri, '(', modifiedObject.Id, ')'].join(''),
                    method:"POST",
                    headers:{"X-HTTP-Method":"MERGE","If-Match":"*"},
                    data: modifiedObject
                };
            }

            OData.request(requestUri
                , function (data,response)
            {
                callback(response);
            }, function (error)
            {
                errorCallback(error);
            });
        };

        // Function to delete an ODATA object
        var deleteObject = function(uri, id, callback, errorCallback)
        {
            Debug('deleteObject',[uri, id].join(','));
            var requestUri = "";
            if (slingshot.runningInCordova)
            {
                var uriString = [uri, '(', id, ')'].join('');
                requestUri = {
                    requestUri:['http://',slingshot.server,uriString].join(''),
                    user:slingshot.username,
                    password:slingshot.password,
                    method:"POST",
                    headers:{"X-HTTP-Method":"DELETE","If-Match":"*"}
                };
            }
            else
            {
                requestUri = {
                    requestUri:[uri, '(', id, ')'].join(''),
                    method:"POST",
                    headers:{"X-HTTP-Method":"DELETE","If-Match":"*"}
                };
            }

            OData.request(requestUri
                , function (data,response)
            {
                callback(response);
            }, function (error)
            {
                errorCallback(error);
            });
        };

        // Used to map ODATA objects directly to JS Announcement objects
        var mapAnnouncement = function(data)
        {
            return new slingshot.announcement(data.Id, data.Title, data.Body);
        }

        // JS class for a sharepoint announcement
        this.announcement = function (Id, Title, Body) {
            this.Id = Id;
            this.Title = Title;
            this.Body = Body;
        };

        // Used to map ODATA objects directly to JS Task objects
        var mapTask = function(data)
        {
            return new slingshot.task(data.Id, data.Title, data.Description, data.Complete, data.StatusValue, data.AssignedToId, data.DueDate, data.RelatedContent, data.ContentType, data.Outcome);
        };

        // JS class for a sharepoint task
        this.task = function (Id, Title, Description, Complete, StatusValue, AssignedToId, DueDate, RelatedContent, ContentType, Outcome) {
            this.Id = Id;
            this.Title = Title;
            this.Description = Description;
            this.Complete = Complete;
            this.StatusValue = StatusValue;
            this.AssignedToId=AssignedToId;
            this.DueDate=DueDate;
            this.RelatedContent=RelatedContent;
            this.ContentType=ContentType;
            this.Outcome=Outcome;
        };

        this.approveItem = function(Id){
            this.Id=Id;
            this._ModerationStatus=0;
        }

        // JS class for a sharepoint file
        this.file = function (id, name, path) {
            this.id = id;
            this.name = name;
            this.path = path;
            this.isFolder = false;
        };

        // JS class for a sharepoint folder
        this.folder = function (id, name, path) {
            this.id = id;
            this.name = name;
            this.path = path;
            this.isFolder = true;
        };

        // Used to map ODATA objects directly to JS Person objects
        var mapPerson = function(data)
        {
            return new slingshot.person(data.Id, data.Name, data.Department, data.JobTitle, data.EMail);
        };

        // JS class for a person
        this.person = function(Id, Name, Department, JobTitle, Email) {
            this.Id = Id;
            this.Name = Name;
            this.Department = Department;
            this.JobTitle = JobTitle;
            this.Email = Email;
        };

        // Function to retrieve a single announcement by Id
        this.getAnnouncement = function (id, callback, errorCallback) {
            getObject(this.announcementsUri, id, function(data)
                {
                    callback(mapAnnouncement(data));
                },
                function(error){
                    errorCallback(error);
                });
        };

        // Function to retrieve an array of all announcements
        this.getAnnouncements = function (callback, errorCallback) {
            var announcements = new Array();
            getObjects(this.announcementsUri, function(data){
                $.each(data, function (index, value) {
                    for (var x in value) {
                        var announcement = mapAnnouncement(value[x]);
                        announcements.push(announcement);
                    }
                });
                callback(announcements);
            }, function(error){
                errorCallback(error);
            });
        };

        // Function to create a new announcement
        this.addAnnouncement = function (newAnnouncement, callback, errorCallback)
        {
            addObject(this.announcementsUri, newAnnouncement, function(data, response){
                callback(data.Id, response);
            }, function (error){
                errorCallback(error);
            });
        };

        // Function to modify an announcement
        this.modifyAnnouncement = function(modifiedAnnouncement, callback, errorCallback)
        {
            modifyObject(this.announcementsUri, modifiedAnnouncement, function(response){
                callback(response);
            }, function(error){
                errorCallback(error);
            });
        };

        // Function to delete an announcement
        this.deleteAnnouncement = function(id, callback, errorCallback)
        {
            deleteObject(this.announcementsUri, id, function(response)
            {
                callback(response);
            }, function(error)
            {
                errorCallback(error);
            });
        };

        // Function to retrieve a single task by Id
        this.getTask = function (id, callback, errorCallback) {
            getObject(this.tasksUri, id, function(data)
            {
                callback(mapTask(data));
            },
            function(error){
                errorCallback(error);
            });
        };

        // Function to retrieve an array of all tasks
        this.getTasks = function (callback, errorCallback) {
            var tasks = new Array();
            getObjects(this.tasksUri, function(data){
                $.each(data, function (index, value) {
                    for (var x in value) {
                        var task = mapTask(value[x]);
                        tasks.push(task);
                    }
                });
                callback(tasks);
            }, function(error){
                errorCallback(error);
            });
        };

        // Function to create a new task
        this.addTask = function (newTask, callback, errorCallback)
        {
            addObject(this.tasksUri, newTask, function(data, response){
                callback(data.Id, response);
            }, function (error){
                errorCallback(error);
            });
        };

        // Function to modify a task
        this.modifyTask = function(modifiedTask, callback, errorCallback)
        {
            modifyObject(this.tasksUri, modifiedTask, function(response){
                callback(response);
            }, function(error){
                errorCallback(error);
            });
        };

        // Function to delete a task
        this.deleteTask = function(id, callback, errorCallback)
        {
            deleteObject(this.tasksUri, id, function(response)
            {
                callback(response);
            }, function(error)
            {
                errorCallback(error);
            });
        };

        // Function to retrieve a single user by Id
        this.getPerson = function (id, callback, errorCallback) {
            getObject(this.userInformationUri, id, function(data)
                {
                    callback(mapPerson(data));
                },
                function(error){
                    errorCallback(error);
                });
        };

        // Function to retrieve an array of all users
        this.getPeople = function (callback, errorCallback) {
            var people = new Array();
            getObjects(this.userInformationUri, function(data){
                $.each(data, function (index, value) {
                    for (var x in value) {
                        if (value[x].ContentType == "Person")
                        {
                            var person = mapPerson(value[x]);
                            people.push(person);
                        }
                    }
                });
                callback(people);
            }, function(error){
                errorCallback(error);
            });
        };

        // Function to retrieve an array of all documents
        this.getDocuments = function (folder, callback, errorCallback) {
            var documents = new Array();
            var fileCount = 0;
            var folderCount = 0;
            getObjects(this.documentsUri, function(data){
                $.each(data, function (index, value) {
                    for (var x in value) {
                        // Look for files on the current path
                        if ((value[x].Path == folder) && (value[x].ContentType == "Document")) {
                            var newFile = new slingshot.file(value[x].Id, value[x].Name, value[x].Path);
                            documents.push(newFile);
                            fileCount++;
                        }
                        // Display folders on the current path
                        if ((value[x].Path == folder) && (value[x].ContentType == "Folder")) {
                            var newFolder = new slingshot.folder(value[x].Id, value[x].Name, value[x].Path);
                            documents.push(newFolder);
                            folderCount++;
                        }
                    }
                });
                callback(documents, fileCount, folderCount);
            }, function(error){
                errorCallback(error);
            });
        };

        // Function to upload a document to a document library
        this.uploadDocument = function(folder, fileName, documentData, callback, errorCallback)
        {
            var copySOAPEnv =
                "<soap12:Envelope xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://www.w3.org/2001/XMLSchema' xmlns:soap12='http://www.w3.org/2003/05/soap-envelope'><soap12:Body><CopyIntoItems xmlns='http://schemas.microsoft.com/sharepoint/soap/'><SourceUrl>"+fileName+"</SourceUrl><DestinationUrls><string>"+"http://"+slingshot.server+folder+"/"+fileName+"</string></DestinationUrls><Fields><FieldInformation Type='File' /></Fields><Stream>" + documentData + "</Stream></CopyIntoItems></soap12:Body></soap12:Envelope>";
            $.ajax({
                url: ['http://',slingshot.server,slingshot.copyWebServiceUri].join(''),
                username:slingshot.username,
                password:slingshot.password,
                type: "POST",
                dataType: "xml",
                data: copySOAPEnv,
                contentType: 'text/xml; charset="utf-8"',
                headers: {"SOAPAction":"http://schemas.microsoft.com/sharepoint/soap/CopyIntoItems"},
                success: function(data) { callback(data, { statusCode:"201" });},
                error: function(error) { callback(error);}
                });
        };

        //Function to update task list item
        this.updateApprovalItem = function(listName, item, moderationStatus, callback, errorCallback)
        {
            if(slingshot.taskListGuid==""){
                slingshot.getListGuid(listName);
            }

            var alterSOAPEnv=
                ["<?xml version='1.0' encoding='utf-8'?>",
                "<soap12:Envelope xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://www.w3.org/2001/XMLSchema' xmlns:soap12='http://www.w3.org/2003/05/soap-envelope'>",
                    "<soap12:Body>",
                        "<AlterToDo xmlns='http://schemas.microsoft.com/sharepoint/soap/workflow/'>",
                            "<item>",item.RelatedContent.substring(0,item.RelatedContent.lastIndexOf(',')),"</item>",
                            "<todoId>",item.Id,"</todoId>",
                            "<todoListId>",slingshot.taskListGuid,"</todoListId>",
                            "<taskData>",
                                "<my:myFields xmlns:my= 'http://schemas.microsoft.com/office/infopath/2003/myXSD'>",
                                    "<my:TaskStatus>",item.Outcome,"</my:TaskStatus>",
                                    "<my:Status>",item.StatusValue,"</my:Status>"+
                                    "<my:PercentComplete>",item.Complete,"</my:PercentComplete>",
                                "</my:myFields>",
                            "</taskData>",
                        "</AlterToDo>",
                    "</soap12:Body>",
                "</soap12:Envelope>"].join('');

                $.ajax({
                url: slingshot.workflowWebServiceUri,
                username:slingshot.username,
                password:slingshot.password,
                type: "POST",
                dataType: "xml",
                data: alterSOAPEnv,
                contentType: 'text/xml; charset="utf-8"',
                headers: {"SOAPAction":"http://schemas.microsoft.com/sharepoint/soap/workflow/AlterToDo"},
                success: function(data) { callback(data, { statusCode:"201" });},
                error: function(error) { callback(error);}
            });
        }

        //Function to get GUID for Tasks list
        this.getListGuid = function(listName){
        var getListEnv =
            ["<?xml version='1.0' encoding='utf-8'?>",
                "<soap12:Envelope xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://www.w3.org/2001/XMLSchema' xmlns:soap12='http://www.w3.org/2003/05/soap-envelope'>",
                    "<soap12:Body>",
                        "<GetList xmlns='http://schemas.microsoft.com/sharepoint/soap/'>",
                            "<listName>",listName,"</listName>",
                        "</GetList>",
                    "</soap12:Body>",
                "</soap12:Envelope>"].join('');

        $.ajax({
            url: slingshot.listWebServiceUri,
            username:slingshot.username,
            password:slingshot.password,
            async:false,
            type: "POST",
            dataType: "xml",
            data: getListEnv,
            contentType: 'text/xml; charset="utf-8"',
            headers: {"SOAPAction":"http://schemas.microsoft.com/sharepoint/soap/GetList"},
            success: function(data, status, xhr) {
                var response = xhr.responseText;
                var Guid = response.substr(response.indexOf("Name")+7, 36);
                slingshot.taskListGuid=Guid;
            },
            error: function(error) { callback(error);}
        });
        };
    };

