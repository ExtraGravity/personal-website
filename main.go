package main

import (
	"fmt"
	"html/template"
	"io/ioutil"
	"net/http"
	"os"
	"path"
	"path/filepath"

	"gopkg.in/yaml.v2"
)

type ArticleSections struct {
	Name    string
	Sources []Article
}

type Article struct {
	URL   string
	Title string
}

func absPath(relativePath string) string {
	dir, err := filepath.Abs(filepath.Dir(os.Args[0]))
	check(err, true)
	result := path.Join(dir, relativePath)
	return result
}

func check(err error, exit bool) {
	if exit {
		defer func() {
			if r := recover(); r != nil {
				fmt.Fprintf(os.Stderr, "%v", r)
				os.Exit(1)
			}
		}()
		if err != nil {
			panic(err)
		}
	} else {
		if err != nil {
			fmt.Fprintf(os.Stderr, "%v", err)
		}
	}
}

func genericPageHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Println("URL was ", r.URL)
	var t *template.Template
	if r.URL.Path == "/" {
		t = template.Must(template.ParseFiles(
			absPath("templates/base.html"),
			absPath("templates/home.html")))
	} else {
		page := absPath("templates/pages/" + r.URL.Path + ".html")
		if _, err := os.Stat(page); os.IsNotExist(err) {
			// page does not exist
			page = "templates/pages/404.html"
		}
		t = template.Must(template.ParseFiles(
			absPath("templates/base.html"), page))
	}
	err := t.ExecuteTemplate(w, "base", nil)
	check(err, true)
}

func articlesPageHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Println("URL was ", r.URL)
	if r.URL.Path != "/articles" {
		http.NotFound(w, r)
		return
	}

	t := template.Must(template.ParseFiles(
		absPath("templates/base.html"),
		absPath("templates/pages/articles.html")))
	err := t.ExecuteTemplate(w, "base", getArticlesConfig())
	check(err, true)
}

func getArticlesConfig() []ArticleSections {
	articlesFile, err := ioutil.ReadFile(path.Join(filepath.Dir(os.Args[0]), "articles.yml"))
	if err != nil {
		check(err, false)
		return []ArticleSections{}
	}

	var articlesConfig []ArticleSections
	err = yaml.Unmarshal(articlesFile, &articlesConfig)
	if err != nil {
		check(err, false)
		return []ArticleSections{}
	}

	fmt.Println("Articles Config ", articlesConfig)

	return articlesConfig
}

func apiHandler(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/api" {
		http.NotFound(w, r)
		return
	}

	if r.Method == "GET" {
		fmt.Println("GET params were:", r.URL.Query())
		fmt.Println("URL was ", r.URL)
		r.ParseForm()
		page := r.URL.Query().Get("page")
		pageTmpl := "templates/pages/" + page + ".html"
		if _, err := os.Stat(pageTmpl); os.IsNotExist(err) {
			// page does not exist
			pageTmpl = "templates/pages/404.html"
		}

		t := template.Must(template.ParseFiles(absPath(pageTmpl)))
		if page == "articles" {
			err := t.ExecuteTemplate(w, "content", getArticlesConfig())
			check(err, true)
		} else {
			err := t.ExecuteTemplate(w, "content", nil)
			check(err, true)

		}

	}
}

func faviconHandler(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, absPath("resources/images/favicon.ico"))
}

func cache(h http.Handler) http.Handler {
	var cacheHeaders = map[string]string{
	// "Cache-Control": "public, max-age=2592000",
	}

	fn := func(w http.ResponseWriter, r *http.Request) {
		for k, v := range cacheHeaders {
			w.Header().Set(k, v)
		}
		h.ServeHTTP(w, r)
	}
	return http.HandlerFunc(fn)
}

func main() {
	http.HandleFunc("/", genericPageHandler)
	http.HandleFunc("/articles", articlesPageHandler)
	http.HandleFunc("/api", apiHandler)
	http.HandleFunc("/api/contact", contactHandler)
	http.HandleFunc("/api/page-list", pageListHandler)
	http.Handle("/resources/", cache(http.StripPrefix("/resources/", http.FileServer(http.Dir(absPath("resources"))))))
	http.HandleFunc("/favicon.ico", faviconHandler)

	port := "8000"

	if len(os.Args) > 1 {
		port = os.Args[1]
	}

	err := http.ListenAndServe(":"+port, nil)
	check(err, true)
}
