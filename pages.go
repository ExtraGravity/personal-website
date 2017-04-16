package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"strings"
)

type PagesList struct {
	Articles []Article
	Pages    []string
}

type Article struct {
	Name  string
	URL   string
	Title string
}

func pageListHandler(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/api/page-list" {
		http.NotFound(w, r)
		return
	}

	if r.Method == "GET" {
		fmt.Println("URL was ", r.URL)

		pagesList := getPagesList()

		fmt.Println("Returning article list ", pagesList)
		message, err := json.Marshal(pagesList)
		check(err, true)

		fmt.Fprintf(w, string(message))
	}
}

func getPagesList() PagesList {
	pagesList := PagesList{}

	// Generate list of articles
	articlesFiles, _ := ioutil.ReadDir("templates/pages/articles")
	for _, f := range articlesFiles {
		suffix := ".html"
		if strings.HasSuffix(f.Name(), ".html") {
			noSuffix := f.Name()[:len(f.Name())-len(suffix)]
			pagesList.Articles = append(pagesList.Articles, Article{
				Name:  noSuffix,
				URL:   "/article/" + noSuffix,
				Title: generateTitle(noSuffix),
			})
			pagesList.Pages = append(pagesList.Pages, noSuffix)
		}
	}

	// Generate list of all pages
	pagesFiles, _ := ioutil.ReadDir("templates/pages")
	for _, f := range pagesFiles {
		suffix := ".html"
		if strings.HasSuffix(f.Name(), ".html") {
			noSuffix := f.Name()[:len(f.Name())-len(suffix)]
			pagesList.Pages = append(pagesList.Pages, noSuffix)
		}
	}

	return pagesList
}

func generateTitle(articleName string) string {
	dashToSpace := strings.Replace(articleName, "-", " ", -1)
	titleSplit := strings.Split(dashToSpace, " ")
	var capitalized string
	for _, word := range titleSplit {
		capitalized += strings.ToTitle(string(word[0])) + word[1:] + " "
	}
	return capitalized
}
