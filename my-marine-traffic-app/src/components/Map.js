import { useState, useMemo, useCallback, useRef } from "react";
import {
  GoogleMap,
  useLoadScript,
  Marker,
  MarkerClusterer,
  Polyline,
} from "@react-google-maps/api";
import { useForm, Controller } from "react-hook-form";
import axios from "axios";
import shipMarker from "../assets/images/shipMarker.png";
import { TextField, Grid, Box } from "@mui/material";
import Button from "@mui/material/Button";

const libraries = ["places"];
const mapContainerStyle = { width: "100%", height: "95vh" };

const Map = () => {
  const [data, setData] = useState([]);
  const [path, setPath] = useState([]);
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAP_API_KEY,
    libraries,
  });
  const center = useMemo(() => ({ lat: 37.98381, lng: 23.727539 }), []);

  const {
    handleSubmit,
    control,
    formState: { isDirty },
    getValues,
  } = useForm();

  const onSubmit = () => {
    let values = getValues();
    axios
      .get(
        `https://services.marinetraffic.com/api/exportvesseltrack/${process.env.REACT_APP_MARINE_TRAFFIC_API_KEY}/v:3/period:daily/days:${values.days}/mmsi:${values.mmsi}/protocol:jsono`
      )
      .then((response) => {
        console.log(response.data);
        mapRef.current?.panTo({
          lat: parseFloat(response.data.at(-1).LAT),
          lng: parseFloat(response.data.at(-1).LON),
        });
        let temp = response.data.map((item) => ({
          lat: parseFloat(item.LAT),
          lng: parseFloat(item.LON),
        }));
        setPath(temp);
        return setData(response.data);
      })

      .catch((error) => {
        console.log("Error: " + error);
      });
  };

  const mapRef = useRef();
  const onLoad = useCallback((map) => (mapRef.current = map), []);
  const optionsMap = useMemo(
    () => ({
      disableDefaultUI: true,
      clickableIcons: false,
    }),
    []
  );
  const optionsPolyline = {
    strokeColor: "#FF0000",
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: "#FF0000",
    fillOpacity: 0.35,
    clickable: false,
    draggable: false,
    editable: false,
    visible: true,
    radius: 30000,
    paths: path,
    zIndex: 1,
  };
  if (loadError) return <div>error loading map</div>;
  if (!isLoaded) return <div>Loading...</div>;

  return (
    <Grid container spacing={2}>
      <Grid item xs={3}>
        <Box>
          <h1>Enter Data</h1>
        </Box>
        <form
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "30vh",
            padding: "24px",
            zIndex: "4",
          }}
          onSubmit={handleSubmit(onSubmit)}
        >
          <Controller
            name="days"
            control={control}
            defaultValue=""
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <TextField
                label="DAYS"
                variant="outlined"
                value={value}
                onChange={onChange}
                error={!!error}
                helperText={error ? error.message : null}
              />
            )}
            rules={{ required: "Days are required" }}
          />

          <Controller
            name="mmsi"
            control={control}
            defaultValue=""
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <TextField
                label="MMSI"
                variant="outlined"
                value={value}
                onChange={onChange}
                error={!!error}
                helperText={error ? error.message : null}
              />
            )}
            rules={{ required: "Mmsi is required" }}
          />
          <Button type="submit" variant="contained" color="primary">
            GET VESSEL TRACK
          </Button>
        </form>
      </Grid>
      <Grid item xs={9}>
        <Box>
          <GoogleMap
            zoom={10}
            mapContainerStyle={mapContainerStyle}
            center={center}
            onLoad={onLoad}
            options={optionsMap}
            ref={mapRef}
          >
            {isDirty && (
              <>
                <MarkerClusterer>
                  {(clusterer) =>
                    data.map((mark) => (
                      <Marker
                        key={mark.LAT}
                        position={{
                          lat: parseFloat(mark.LAT),
                          lng: parseFloat(mark.LON),
                        }}
                        icon={shipMarker}
                        title={`${new Date(mark.TIMESTAMP).toString()}`}
                        clusterer={clusterer}
                      />
                    ))
                  }
                </MarkerClusterer>
                <Polyline path={path} options={optionsPolyline} />
              </>
            )}
          </GoogleMap>
        </Box>
      </Grid>
    </Grid>
  );
};

export default Map;
