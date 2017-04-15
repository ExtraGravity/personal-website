package main

import (
	"fmt"
	"html/template"
	"net/http"
	"os"
	"path"
	"path/filepath"
)

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
				fmt.Fprintf(os.Stderr, "%s", r)
				os.Exit(1)
			}
		}()
		if err != nil {
			panic(err)
		}
	} else {
		fmt.Fprintf(os.Stderr, "%s", err)
	}
}

func rootHandler(w http.ResponseWriter, r *http.Request) {
	t := template.Must(template.ParseFiles(
		absPath("templates/base.html"),
		absPath("templates/home.html")))
	err := t.ExecuteTemplate(w, "base", nil)
	check(err, true)
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
		err := t.ExecuteTemplate(w, "content", nil)
		check(err, true)
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

	http.HandleFunc("/", rootHandler)
	http.HandleFunc("/api", apiHandler)
	http.HandleFunc("/api/contact", contactHandler)
	http.Handle("/resources/", cache(http.StripPrefix("/resources/", http.FileServer(http.Dir(absPath("resources"))))))
	http.HandleFunc("/favicon.ico", faviconHandler)

	err := http.ListenAndServe(":8000", nil)
	check(err, true)
}
