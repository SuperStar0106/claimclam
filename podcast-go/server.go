package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"time"
)

const (
	apiBaseURL = "https://601f1754b5a0e9001706a292.mockapi.io/podcasts"
)

type Podcast struct {
	ID              string        `json:"id"`
	Title           string        `json:"title"`
	Description     string        `json:"description"`
	Images          PodcastImages `json:"images"`
	IsExclusive     bool          `json:"isExclusive"`
	PublisherName   string        `json:"publisherName"`
	PublisherID     string        `json:"publisherId"`
	MediaType       string        `json:"mediaType"`
	CategoryID      string        `json:"categoryId"`
	CategoryName    string        `json:"categoryName"`
	HasFreeEpisodes bool          `json:"hasFreeEpisodes"`
	PlaySequence    string        `json:"playSequence"`
}

type PodcastImages struct {
	Default   string `json:"default"`
	Featured  string `json:"featured"`
	Thumbnail string `json:"thumbnail"`
	Wide      string `json:"wide"`
}

type PodcastsResponse struct {
	Items []Podcast `json:"items"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}

func fetchPodcasts(apiURL string) ([]Podcast, error) {
	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	req, err := http.NewRequest("GET", apiURL, nil)
	if err != nil {
		return nil, fmt.Errorf("error creating request: %v", err)
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error making the request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return []Podcast{}, nil
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	var podcastsResponse PodcastsResponse
	err = json.NewDecoder(resp.Body).Decode(&podcastsResponse)
	if err != nil {
		return nil, fmt.Errorf("error decoding JSON: %v", err)
	}

	return podcastsResponse.Items, nil
}

func podcastsHandler(w http.ResponseWriter, r *http.Request) {
	searchQuery := r.URL.Query().Get("search")
	page := r.URL.Query().Get("page")

	apiURL, err := url.Parse(apiBaseURL)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error parsing API URL: %v", err), http.StatusInternalServerError)
		return
	}

	query := apiURL.Query()
	query.Set("p", page)
	query.Set("l", "10")
	query.Set("search", searchQuery)
	apiURL.RawQuery = query.Encode()

	podcasts, err := fetchPodcasts(apiURL.String())
	if err != nil {
		http.Error(w, fmt.Sprintf("Error fetching podcasts: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(PodcastsResponse{Items: podcasts})
}

func main() {
	http.HandleFunc("/api/podcasts", podcastsHandler)
	fmt.Println("Server is running on :8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		fmt.Printf("Error starting server: %v\n", err)
	}
}
