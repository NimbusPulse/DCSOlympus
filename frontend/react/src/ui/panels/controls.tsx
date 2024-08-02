import React, { useEffect, useState } from "react";
import { getApp } from "../../olympusapp";
import { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
export function ControlsPanel(props: {}) {
  const [controls, setControls] = useState(
    [] as {
      actions: (string | IconDefinition)[];
      target: IconDefinition;
      text: string;
    }[]
  );

  useEffect(() => {
    if (getApp() && controls.length === 0) {
      setControls(getApp().getMap().getCurrentControls());
    }
  });

  document.addEventListener("mapStateChanged", (ev) => {
    setControls(getApp().getMap().getCurrentControls());
  });

  return (
    <div
      className={`
        absolute bottom-[20px] right-[10px] w-80 z-ui-0 flex flex-col
        items-center justify-between gap-1 p-3 text-sm
      `}
    >
      {controls.map((control) => {
        return (
          <div
            className={`
              flex w-full justify-between gap-2 rounded-full py-1 pl-4 pr-1
              backdrop-blur-lg
              dark:bg-olympus-800/90 dark:text-gray-200
            `}
          >
            <div className="my-auto overflow-hidden text-nowrap">
              {control.text}
            </div>
            <div
              className={`
                ml-auto flex gap-1 rounded-full bg-olympus-500 px-2 py-0.5
                text-sm font-bold text-white
              `}
            >
              {control.actions.map((action, idx) => {
                return (
                  <>
                    <div className={``}>
                      {typeof action === "string" ? (
                        action
                      ) : (
                        <FontAwesomeIcon
                          icon={action}
                          className={`my-auto ml-auto`}
                        />
                      )}
                    </div>
                    {idx < control.actions.length - 1 && <div>+</div>}
                  </>
                );
              })}
            </div>
            {/*}
            <div className="my-auto">on</div>
            
            <div
              className={`
                flex gap-1 rounded-full bg-olympus-500 px-2 py-0.5 text-sm
                font-bold text-white
              `}
            >
              <FontAwesomeIcon icon={control.target} className="my-auto" />
            </div>
            {*/}
          </div>
        );
      })}
    </div>
  );
}
